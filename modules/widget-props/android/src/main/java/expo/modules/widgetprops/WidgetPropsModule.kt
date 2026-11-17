package expo.modules.widgetprops

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.os.Build
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

// expo-widgets keeps each Android widget's current props, including changes made by
// button presses on the widget, in these shared preferences. It has no JS API to read
// them back yet, so this module does.
private const val PREFERENCES_NAME = "expo.modules.widgets"

// expo-widgets' config plugin generates one provider per widget, named <package>.<name>Provider.
private fun providerFor(context: Context, name: String) =
  ComponentName(context.packageName, "${context.packageName}.${name}Provider")

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

    // Whether the launcher can place a widget for us after the user confirms. Needs
    // Android 8 and a launcher that supports it (most do, some third-party ones don't).
    Function("canRequestPin") {
      val context = appContext.reactContext ?: return@Function false
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return@Function false
      AppWidgetManager.getInstance(context).isRequestPinAppWidgetSupported
    }

    // How many copies of the widget are on the home screen.
    Function("placedCount") { name: String ->
      val context = appContext.reactContext ?: return@Function 0
      runCatching { AppWidgetManager.getInstance(context).getAppWidgetIds(providerFor(context, name)).size }
        .getOrDefault(0)
    }

    // Asks the launcher to show its "Add to home screen" dialog for the widget. Returns
    // false when it can't. The user may still cancel the dialog, so check placedCount
    // when the app comes back to the foreground.
    Function("requestPin") { name: String ->
      val context = appContext.reactContext ?: return@Function false
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return@Function false
      val manager = AppWidgetManager.getInstance(context)
      if (!manager.isRequestPinAppWidgetSupported) return@Function false
      runCatching { manager.requestPinAppWidget(providerFor(context, name), null, null) }.getOrDefault(false)
    }
  }
}
