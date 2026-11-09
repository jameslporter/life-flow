import ExpoModulesCore

public final class ActivityChecksModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ActivityChecks")

    OnCreate {
      ActivityChecks.startObserving()
    }

    /** Check-offs made on the Live Activity since the last call, as { taskId, day }. */
    Function("takePending") { () -> [[String: String]] in
      ActivityChecks.takePending()
    }
  }
}

/** Starts listening at launch, before the Live Activity's button intent runs. */
public class ActivityChecksAppDelegateSubscriber: ExpoAppDelegateSubscriber {
  public func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    ActivityChecks.startObserving()
    return true
  }
}
