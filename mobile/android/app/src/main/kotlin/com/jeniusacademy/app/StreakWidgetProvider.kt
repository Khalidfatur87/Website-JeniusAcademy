package com.jeniusacademy.app

import android.appwidget.AppWidgetManager
import android.content.Context
import android.content.SharedPreferences
import android.widget.RemoteViews
import es.antonborri.home_widget.HomeWidgetLaunchIntent
import es.antonborri.home_widget.HomeWidgetProvider

/**
 * Widget layar utama: streak belajar, level & XP minggu ini.
 * Data ditulis oleh aplikasi Flutter (lib/core/home_widget_sync.dart) lewat home_widget.
 */
class StreakWidgetProvider : HomeWidgetProvider() {
    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray,
        widgetData: SharedPreferences,
    ) {
        for (id in appWidgetIds) {
            val views = RemoteViews(context.packageName, R.layout.streak_widget).apply {
                setTextViewText(R.id.widget_streak, widgetData.getString("streak", "0") ?: "0")
                setTextViewText(R.id.widget_title, widgetData.getString("title", "Streak") ?: "Streak")
                setTextViewText(R.id.widget_subtitle, widgetData.getString("subtitle", "") ?: "")
                // Ketuk widget → buka aplikasi.
                setOnClickPendingIntent(
                    R.id.widget_root,
                    HomeWidgetLaunchIntent.getActivity(context, MainActivity::class.java),
                )
            }
            appWidgetManager.updateAppWidget(id, views)
        }
    }
}
