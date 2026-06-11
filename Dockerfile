FROM openjdk:17-jdk-slim

# Install required packages and 32-bit libraries
RUN apt-get update && \
    apt-get install -y wget unzip git curl && \
    dpkg --add-architecture i386 && \
    apt-get update && \
    apt-get install -y libc6-i386 lib32stdc++6 lib32gcc-s1 lib32z1

# Install Node.js 18 and npm
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs

# Install Cordova
RUN npm install -g cordova

# Install Gradle (latest)
RUN wget https://services.gradle.org/distributions/gradle-8.7-bin.zip -P /tmp && \
    unzip -d /opt/gradle /tmp/gradle-8.7-bin.zip && \
    ln -s /opt/gradle/gradle-8.7/bin/gradle /usr/bin/gradle

ENV PATH=$PATH:/opt/gradle/gradle-8.7/bin

# Download and set up Android SDK Command Line Tools
RUN mkdir -p /opt/android-sdk/cmdline-tools && \
    cd /opt/android-sdk/cmdline-tools && \
    wget https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip -O cmdline-tools.zip && \
    unzip cmdline-tools.zip && \
    mkdir tools && \
    mv cmdline-tools/* tools/ && \
    rmdir cmdline-tools

ENV ANDROID_HOME=/opt/android-sdk
ENV ANDROID_SDK_ROOT=/opt/android-sdk
ENV PATH=$PATH:/opt/android-sdk/cmdline-tools/tools/bin:/opt/android-sdk/platform-tools:/opt/android-sdk/emulator

# Accept licenses and install build tools
RUN yes | sdkmanager --sdk_root=${ANDROID_SDK_ROOT} --licenses
RUN sdkmanager --sdk_root=${ANDROID_SDK_ROOT} "platform-tools" "platforms;android-34" "build-tools;35.0.0"

WORKDIR /app