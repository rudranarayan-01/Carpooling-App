import { useAppTheme } from "@/theme/ThemeProvider";
import { useEffect, useRef } from "react";
import { Animated, Image, Text, View } from "react-native";

export default function CustomSplashScreen({
  onFinish,
}: {
  onFinish?: () => void;
}) {
  const { colors, isDark } = useAppTheme();

  // Animation values
  const logoScale = useRef(new Animated.Value(0.9)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 800,
        delay: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Trigger native splash hide once mounted
  useEffect(() => {
    if (onFinish) {
      onFinish();
    }
  }, []);

  return (
    <View
      className="flex-1 items-center justify-center overflow-hidden"
      style={{ backgroundColor: colors.bg }}
    >
      {/* Ambient Background Glow */}
      <View
        className="absolute -top-[100px] h-[350px] w-[120%] rounded-full"
        style={{
          backgroundColor: isDark
            ? "rgba(37, 99, 235, 0.07)"
            : "rgba(37, 99, 235, 0.03)",
        }}
      />

      {/* Main Logo */}
      <Animated.View
        className="mb-5 items-center"
        style={{
          opacity: logoOpacity,
          transform: [{ scale: logoScale }],
        }}
      >
        <View
          className="h-[150px] w-[150px] items-center justify-center rounded-[38px] border border-white/10"
          style={{
            backgroundColor: "#020817",
            shadowColor: "#3B82F6",
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.3,
            shadowRadius: 24,
            elevation: 12,
          }}
        >
          <Image
            source={require("@/assets/images/notification-icon.png")}
            style={{
              width: 115,
              height: 115,
              resizeMode: "contain",
            }}
            onError={(error) =>
              console.log("Splash logo loading error:", error.nativeEvent)
            }
            onLoad={() => console.log("Splash logo loaded successfully")}
          />
        </View>
      </Animated.View>

      {/* Branding */}
      <Animated.View
        className="items-center px-6"
        style={{ opacity: contentOpacity }}
      >
        <Text
          className="text-center text-[38px] font-black tracking-[-1.2px]"
          style={{ color: colors.text }}
        >
          Pool
          <Text style={{ color: isDark ? "#3B82F6" : colors.primary }}>
            Share
          </Text>
        </Text>

        <Text
          className="mt-2 text-center text-[11px] font-bold uppercase tracking-[3px]"
          style={{
            color: colors.muted,
            opacity: 0.8,
          }}
        >
          Smart Commuting Community
        </Text>
      </Animated.View>

      {/* Bottom Loading Indicator */}
      <Animated.View
        className="absolute bottom-[60px] left-0 right-0 items-center"
        style={{ opacity: contentOpacity }}
      >
        <View className="mb-3 flex-row items-center justify-center gap-2">
          <View
            className="h-[6px] w-[6px] rounded-full"
            style={{
              backgroundColor: isDark ? "#3B82F6" : colors.primary,
            }}
          />

          <View
            className="h-[6px] w-[6px] rounded-full"
            style={{
              backgroundColor: isDark ? "#3B82F6" : colors.primary,
              opacity: 0.4,
            }}
          />

          <View
            className="h-[6px] w-[6px] rounded-full"
            style={{
              backgroundColor: isDark ? "#3B82F6" : colors.primary,
              opacity: 0.15,
            }}
          />
        </View>

        <Text
          className="text-[10px] font-extrabold uppercase tracking-[2.5px]"
          style={{
            color: colors.muted,
            opacity: 0.6,
          }}
        >
          Secure Ride Sharing
        </Text>
      </Animated.View>
    </View>
  );
}
