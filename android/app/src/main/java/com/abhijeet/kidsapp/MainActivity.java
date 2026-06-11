package com.alphagaming.brainGamesHub;

import android.app.Activity;
import android.app.Application;
import android.os.Bundle;
import android.os.Build;
import android.speech.tts.TextToSpeech;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.WebSettings;
import android.webkit.WebView;

import androidx.activity.EdgeToEdge;
import androidx.core.splashscreen.SplashScreen;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.BridgeActivity;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class MainActivity extends BridgeActivity {

  private static TextToSpeech ttsInstance;
  private static final ExecutorService backgroundCleanupExecutor =
      Executors.newSingleThreadExecutor();

  public static void setTtsInstance(TextToSpeech tts) {
    ttsInstance = tts;
  }

  /**
   * Kills TTS service safely.
   * Moved to background thread to prevent ANRs during activity transitions.
   */
  private void forceStopTTS() {
    try {
      if (ttsInstance != null) {
        final TextToSpeech tts = ttsInstance;
        ttsInstance = null;
        backgroundCleanupExecutor.execute(() -> {
          try {
            tts.stop();
            tts.shutdown();
          } catch (Exception ignored) {}
        });
      }
    } catch (Exception ignored) {}
  }

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    SplashScreen.installSplashScreen(this);
    EdgeToEdge.enable(this);
    super.onCreate(savedInstanceState);

    registerPlugin(AgeVerificationPlugin.class);

    configureWebViewForGames();
    
    applyImmersiveFullscreen();
  }

  @Override
  public void onPause() {
    super.onPause();
    forceStopTTS();
  }

  @Override
  public void onStop() {
    super.onStop();
    forceStopTTS();
  }

  @Override
  public void onDestroy() {
    forceStopTTS();
    super.onDestroy();
  }

  @Override
  public void onTrimMemory(int level) {
    super.onTrimMemory(level);

    if (level >= TRIM_MEMORY_RUNNING_LOW) {
      WebView webView = getBridge() != null ? getBridge().getWebView() : null;
      if (webView != null) {
        webView.clearCache(false);
      }
    }
  }

  private void configureWebViewForGames() {
    WebView webView = getBridge() != null ? getBridge().getWebView() : null;
    if (webView == null) {
      return;
    }

    webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);
    webView.setVerticalScrollBarEnabled(false);
    webView.setHorizontalScrollBarEnabled(false);
    webView.setOverScrollMode(View.OVER_SCROLL_NEVER);

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      webView.setRendererPriorityPolicy(WebView.RENDERER_PRIORITY_BOUND, true);
    }

    WebSettings settings = webView.getSettings();
    settings.setDomStorageEnabled(true);
    settings.setCacheMode(WebSettings.LOAD_DEFAULT);
    settings.setMediaPlaybackRequiresUserGesture(false);
  }

  private void applyImmersiveFullscreen() {
    Window window = getWindow();
    if (window == null) {
      return;
    }

    // Configure layout for notch and cutouts
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      WindowManager.LayoutParams layoutParams = window.getAttributes();
      layoutParams.layoutInDisplayCutoutMode =
          WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_ALWAYS;
      window.setAttributes(layoutParams);
    }
    WindowCompat.setDecorFitsSystemWindows(window, false);

    // Hide system bars
    WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(window, window.getDecorView());
    if (controller != null) {
      controller.hide(WindowInsetsCompat.Type.systemBars());
      controller.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
    }
  }

  @Override
  public void onWindowFocusChanged(boolean hasFocus) {
    super.onWindowFocusChanged(hasFocus);
    if (hasFocus) {
      applyImmersiveFullscreen();
    }
  }
}
