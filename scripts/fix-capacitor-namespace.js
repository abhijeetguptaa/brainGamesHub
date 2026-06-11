#!/usr/bin/env node
/**
 * This script fixes the namespace in capacitor-cordova-android-plugins/build.gradle
 * and removes package attribute from AndroidManifest.xml after cap sync regenerates them.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const buildGradlePath = path.join(
  __dirname,
  '..',
  'android',
  'capacitor-cordova-android-plugins',
  'build.gradle',
);
const manifestPath = path.join(
  __dirname,
  '..',
  'android',
  'capacitor-cordova-android-plugins',
  'src',
  'main',
  'AndroidManifest.xml',
);

// Fix build.gradle
if (fs.existsSync(buildGradlePath)) {
  let content = fs.readFileSync(buildGradlePath, 'utf8');

  // Check if namespace is already present
  if (!content.includes('namespace "com.abhijeet.kidsapp.capacitorcordova"')) {
    // Check if android block exists
    if (content.includes('android {')) {
      // Add namespace right after 'android {' line
      content = content.replace(
        /(android\s*\{)/,
        `$1\n    namespace "com.abhijeet.kidsapp.capacitorcordova"`,
      );

      // Also ensure androidxAppCompatVersion is available in ext block
      if (!content.includes('androidxAppCompatVersion')) {
        if (content.includes('ext {')) {
          // Add to existing ext block
          content = content.replace(
            /(ext\s*\{)/,
            `$1\n    androidxAppCompatVersion = project.hasProperty('androidxAppCompatVersion') ? rootProject.ext.androidxAppCompatVersion : '1.7.0'`,
          );
        } else {
          // Add ext block before buildscript
          content = content.replace(
            /(buildscript)/,
            `ext {\n    androidxAppCompatVersion = project.hasProperty('androidxAppCompatVersion') ? rootProject.ext.androidxAppCompatVersion : '1.7.0'\n}\n\n$1`,
          );
        }
      }

      // Ensure androidx.appcompat dependency exists in SUB-PROJECT DEPENDENCIES section
      if (!content.includes('androidx.appcompat:appcompat')) {
        // Add it after the other androidx dependencies
        content = content.replace(
          /(implementation "androidx\.legacy:legacy-support-v4:[^"]+")/,
          `$1\n    implementation "androidx.appcompat:appcompat:$androidxAppCompatVersion"`,
        );
      }

      fs.writeFileSync(buildGradlePath, content, 'utf8');
      console.log('✅ Fixed namespace in capacitor-cordova-android-plugins/build.gradle');
    }
  } else {
    console.log('Namespace already present in build.gradle, skipping.');
  }
} else {
  console.log('build.gradle not found, skipping fix.');
}

// Fix AndroidManifest.xml - remove package attribute
if (fs.existsSync(manifestPath)) {
  let manifestContent = fs.readFileSync(manifestPath, 'utf8');

  // Remove package attribute if it exists
  if (manifestContent.includes('package="capacitor.android.plugins"')) {
    manifestContent = manifestContent.replace(/package="capacitor\.android\.plugins"\s*/, '');
    fs.writeFileSync(manifestPath, manifestContent, 'utf8');
    console.log('✅ Removed package attribute from AndroidManifest.xml');
  } else {
    console.log('Package attribute already removed from AndroidManifest.xml, skipping.');
  }
} else {
  console.log('AndroidManifest.xml not found, skipping fix.');
}
