package expo.modules.widgetprops

import android.content.Context
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

// expo-widgets keeps each Android widget's current props, including changes made by
// button presses on the widget, in these shared preferences. It has no JS API to read
// them back yet, so this module does.
private const val PREFERENCES_NAME = "expo.modules.widgets"

class WidgetPropsModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("WidgetProps")

    Function("getProps") { name: String ->
      val context = appContext.reactContext ?: return@Function null
      context
        .getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE)
        .getString("__expo_widgets_${name}_props", null)
    }

    Function("scheduleRefreshes") { times: List<Double>, widgets: List<String>, notificationName: String?, notificationId: String?, notificationTarget: String? ->
      val context = appContext.reactContext?.applicationContext ?: return@Function
      GlanceRefreshReceiver.schedule(
        context,
        times.map { it.toLong() },
        widgets,
        notificationName,
        notificationId,
        notificationTarget
      )
    }
  }
}
