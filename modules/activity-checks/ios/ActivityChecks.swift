import ActivityKit
import Foundation
import UIKit

/**
 Mirrors expo-widgets' Live Activity attributes. ActivityKit matches activities by the
 attributes type's name and its Codable shape, so the name and fields must stay the same.
 */
struct LiveActivityAttributes: ActivityAttributes {
  var url: String?

  public struct ContentState: Codable, Hashable {
    var name: String
    var props: String?
  }
}

/**
 Handles a press on a task in the Live Activity inside the app process, without waiting
 for JavaScript. iOS runs the button's intent in the app (launching it in the background
 if needed) and expo-widgets only forwards it to JS, which may not be running or may be
 suspended again before it can react. Here we:

 1. Remember the check-off so the app can apply it to its data later (`takePending`).
 2. Mark the task done in the activity, move on to the next part of the day with tasks
    left once the current one is done, and end the activity when nothing is left today.
 */
enum ActivityChecks {
  static let activityName = "TasksActivity"
  private static let pendingKey = "life-flow.pending-activity-checks"
  private static let togglePrefix = "toggle:"
  private static let interaction = Notification.Name("onExpoWidgetsUserInteraction")
  private static var observer: NSObjectProtocol?
  private static let lock = NSLock()

  static func startObserving() {
    lock.lock()
    defer { lock.unlock() }
    guard observer == nil else { return }
    observer = NotificationCenter.default.addObserver(forName: interaction, object: nil, queue: nil) { note in
      guard let data = note.userInfo?["eventData"] as? [String: Any],
            data["source"] as? String == activityName,
            let target = data["target"] as? String,
            target.hasPrefix(togglePrefix) else {
        return
      }
      handlePress(taskId: String(target.dropFirst(togglePrefix.count)))
    }
  }

  /** Check-offs made on the Live Activity that the app hasn't applied yet. Clears them. */
  static func takePending() -> [[String: String]] {
    lock.lock()
    defer { lock.unlock() }
    let pending = UserDefaults.standard.array(forKey: pendingKey) as? [[String: String]] ?? []
    UserDefaults.standard.removeObject(forKey: pendingKey)
    return pending
  }

  private static func addPending(taskId: String, day: String) {
    lock.lock()
    defer { lock.unlock() }
    var pending = UserDefaults.standard.array(forKey: pendingKey) as? [[String: String]] ?? []
    pending.append(["taskId": taskId, "day": day])
    UserDefaults.standard.set(pending, forKey: pendingKey)
  }

  private static func handlePress(taskId: String) {
    guard #available(iOS 16.2, *) else {
      addPending(taskId: taskId, day: todayKey())
      return
    }
    let activity = Activity<LiveActivityAttributes>.activities.first { $0.content.state.name == activityName }
    let props = activity.flatMap { decode($0.content.state.props) }
    addPending(taskId: taskId, day: props?["day"] as? String ?? todayKey())
    guard let activity, let props else { return }

    // Ask for a little time so the update finishes even if iOS would suspend us right away.
    let app = UIApplication.shared
    var backgroundTask = UIBackgroundTaskIdentifier.invalid
    backgroundTask = app.beginBackgroundTask {
      app.endBackgroundTask(backgroundTask)
      backgroundTask = .invalid
    }

    Task {
      defer {
        if backgroundTask != .invalid { app.endBackgroundTask(backgroundTask) }
      }
      let (next, finished) = advance(props, checking: taskId)
      let state = LiveActivityAttributes.ContentState(name: activityName, props: encode(next))
      if finished {
        await activity.end(ActivityContent(state: state, staleDate: nil), dismissalPolicy: .default)
      } else {
        let staleDate = (next["endsAt"] as? Double).map { Date(timeIntervalSince1970: $0 / 1000) }
        await activity.update(ActivityContent(state: state, staleDate: staleDate))
      }
    }
  }

  /**
   Marks the task done. While every task in the shown period is done, moves on to the
   next period in `later`. `finished` is true when nothing is left for today.
   Keep in step with `activityGlance` in src/lib/glance-common.ts.
   */
  static func advance(_ props: [String: Any], checking taskId: String) -> ([String: Any], Bool) {
    func markDone(_ tasks: Any?) -> [[String: Any]] {
      let list = tasks as? [[String: Any]] ?? []
      return list.map { task in
        var task = task
        if task["id"] as? String == taskId { task["done"] = true }
        return task
      }
    }
    func allDone(_ tasks: Any?) -> Bool {
      (tasks as? [[String: Any]] ?? []).allSatisfy { $0["done"] as? Bool == true }
    }

    var current = props
    current["tasks"] = markDone(current["tasks"])
    var later = (current["later"] as? [[String: Any]] ?? []).map { period -> [String: Any] in
      var period = period
      period["tasks"] = markDone(period["tasks"])
      return period
    }
    while allDone(current["tasks"]) {
      guard !later.isEmpty else {
        current["later"] = [[String: Any]]()
        return (current, true)
      }
      for (key, value) in later.removeFirst() { current[key] = value }
    }
    current["later"] = later
    return (current, false)
  }

  private static func decode(_ raw: String?) -> [String: Any]? {
    guard let data = raw?.data(using: .utf8) else { return nil }
    return (try? JSONSerialization.jsonObject(with: data)) as? [String: Any]
  }

  private static func encode(_ props: [String: Any]) -> String? {
    guard let data = try? JSONSerialization.data(withJSONObject: props) else { return nil }
    return String(data: data, encoding: .utf8)
  }

  private static func todayKey() -> String {
    let formatter = DateFormatter()
    formatter.calendar = Calendar(identifier: .gregorian)
    formatter.locale = Locale(identifier: "en_US_POSIX")
    formatter.dateFormat = "yyyy-MM-dd"
    return formatter.string(from: Date())
  }
}
