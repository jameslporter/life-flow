package expo.modules.widgetprops

import android.app.AlarmManager
import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.content.BroadcastReceiver
import android.content.ComponentName
import android.content.Context
import android.content.Intent

private const val ACTION_REFRESH = "expo.modules.widgetprops.ACTION_REFRESH"
private const val EXTRA_WIDGETS = "expo.modules.widgetprops.extra.WIDGETS"
private const val EXTRA_NOTIFICATION_NAME = "expo.modules.widgetprops.extra.NOTIFICATION_NAME"
private const val EXTRA_NOTIFICATION_ID = "expo.modules.widgetprops.extra.NOTIFICATION_ID"
private const val EXTRA_NOTIFICATION_TARGET = "expo.modules.widgetprops.extra.NOTIFICATION_TARGET"

// How many upcoming refreshes we keep scheduled. Each one has its own request code.
private const val MAX_REFRESHES = 6

// Alarms never fire early, but give the layouts a moment past the boundary they compare against.
private const val SLACK_MS = 2_000L

// expo-widgets' notification button receiver and its intent keys. They aren't public API,
// so keep them in step with WidgetInteractionAction.kt in expo-widgets when upgrading.
private const val EXPO_NOTIFICATION_RECEIVER = "expo.modules.widgets.notifications.ExpoWidgetsNotificationReceiver"
private const val EXPO_NOTIFICATION_ACTION = "expo.modules.widgets.ACTION_NOTIFICATION_INTERACTION"
private const val EXPO_SOURCE_EXTRA = "expo.modules.widgets.extra.SOURCE"
private const val EXPO_TARGET_EXTRA = "expo.modules.widgets.extra.TARGET"
private const val EXPO_NOTIFICATION_ID_EXTRA = "expo.modules.widgets.extra.NOTIFICATION_ID"

/**
 * Redraws the widgets and the pinned notification when a part of the day starts, without
 * starting the app's JS. Android widgets have no timeline, and background tasks can run
 * hours late, so this is what moves them on at 9:00, 17:00 and midnight.
 */
class GlanceRefreshReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action != ACTION_REFRESH) return

    // A plain widget update makes expo-widgets draw the layout again, and the layout
    // picks the entry for the current time.
    val widgetManager = AppWidgetManager.getInstance(context)
    intent.getStringArrayExtra(EXTRA_WIDGETS)?.forEach { name ->
      val provider = ComponentName(context.packageName, "${context.packageName}.${name}Provider")
      val ids = runCatching { widgetManager.getAppWidgetIds(provider) }.getOrNull()
      if (ids == null || ids.isEmpty()) return@forEach
      context.sendBroadcast(
        Intent(AppWidgetManager.ACTION_APPWIDGET_UPDATE)
          .setComponent(provider)
          .putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids)
      )
    }

    // Notifications only redraw when posted again. A press on a hidden button does that:
    // expo-widgets runs the layout's handler for it and re-posts with the new props.
    // Nothing happens if the notification isn't showing.
    val name = intent.getStringExtra(EXTRA_NOTIFICATION_NAME)
    val id = intent.getStringExtra(EXTRA_NOTIFICATION_ID)
    val target = intent.getStringExtra(EXTRA_NOTIFICATION_TARGET)
    if (name != null && id != null && target != null) {
      context.sendBroadcast(
        Intent(EXPO_NOTIFICATION_ACTION)
          .setClassName(context, EXPO_NOTIFICATION_RECEIVER)
          .putExtra(EXPO_SOURCE_EXTRA, name)
          .putExtra(EXPO_TARGET_EXTRA, target)
          .putExtra(EXPO_NOTIFICATION_ID_EXTRA, id)
      )
    }
  }

  companion object {
    /**
     * Replaces the scheduled refreshes with one at each of `times` (Unix ms) still ahead.
     * Uses inexact alarms, which need no special permission and usually fire within minutes.
     */
    fun schedule(
      context: Context,
      times: List<Long>,
      widgets: List<String>,
      notificationName: String?,
      notificationId: String?,
      notificationTarget: String?
    ) {
      val alarms = context.getSystemService(AlarmManager::class.java) ?: return
      val now = System.currentTimeMillis()
      val upcoming = times.filter { it > now }.distinct().sorted().take(MAX_REFRESHES)
      for (index in 0 until MAX_REFRESHES) {
        val intent = Intent(context, GlanceRefreshReceiver::class.java)
          .setAction(ACTION_REFRESH)
          .putExtra(EXTRA_WIDGETS, widgets.toTypedArray())
          .putExtra(EXTRA_NOTIFICATION_NAME, notificationName)
          .putExtra(EXTRA_NOTIFICATION_ID, notificationId)
          .putExtra(EXTRA_NOTIFICATION_TARGET, notificationTarget)
        val pending = PendingIntent.getBroadcast(
          context,
          index,
          intent,
          PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        val time = upcoming.getOrNull(index)
        if (time == null) {
          alarms.cancel(pending)
        } else {
          // Allowed to fire in Doze, at most about once every 9 minutes, which is plenty here.
          alarms.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, time + SLACK_MS, pending)
        }
      }
    }
  }
}
