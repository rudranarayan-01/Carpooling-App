import { useAppTheme } from "@/theme/ThemeProvider";
import { BlurView } from "expo-blur";
import * as DocumentPicker from "expo-document-picker";
import { File } from "expo-file-system";
import {
  AlertCircle,
  BadgeCheck,
  Car,
  FileText,
  Hash,
  Palette,
  Plus,
  ShieldCheck,
  X,
} from "lucide-react-native";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ─── Types ────────────────────────────────────────────────────────────────────

type VehicleFormErrors = {
  brand?: string;
  model?: string;
  registrationNumber?: string;
  seats?: string;
  vehiclePhoto?: string;
  rcFile?: string;
};

// ─── Field Components ─────────────────────────────────────────────────────────

function FieldLabel({ label, colors }: { label: string; colors: any }) {
  return (
    <Text
      className="text-[11px] font-bold uppercase tracking-wider mb-1.5 ml-0.5"
      style={{ color: colors.muted }}
    >
      {label}
    </Text>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <View className="flex-row items-center gap-1 mt-1.5 ml-0.5">
      <AlertCircle size={12} color="#EF4444" />
      <Text className="text-[11px] text-red-500 font-medium">{message}</Text>
    </View>
  );
}

function AppInput({
  icon,
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize,
  error,
  colors,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: "default" | "email-address" | "phone-pad" | "numeric";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  error?: string;
  colors: any;
}) {
  return (
    <View className="flex-1 mb-3.5">
      <FieldLabel label={label} colors={colors} />
      <View
        className="flex-row items-center gap-3 px-3.5 rounded-2xl border min-h-[50px]"
        style={{
          backgroundColor: colors.input,
          borderColor: colors.border,
        }}
      >
        <View className="opacity-70">{icon}</View>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          className="flex-1 text-sm font-semibold py-0"
          style={{ color: colors.text }}
        />
      </View>
      <FieldError message={error} />
    </View>
  );
}

function SeatSelector({
  seats,
  setSeats,
  error,
  colors,
}: {
  seats: string;
  setSeats: (v: string) => void;
  error?: string;
  colors: any;
}) {
  const n = Math.max(1, Number(seats || 1));

  return (
    <View className="mb-3.5">
      <FieldLabel label="Seats" colors={colors} />
      <View
        className="flex-row items-center justify-between px-3.5 py-2 rounded-2xl border min-h-[50px]"
        style={{
          backgroundColor: colors.input,
          borderColor: error ? "#EF4444" : colors.border,
        }}
      >
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setSeats(String(Math.max(1, n - 1)))}
          className="w-8 h-8 rounded-xl items-center justify-center shadow-sm"
          style={{ backgroundColor: colors.card }}
        >
          <Text className="text-lg font-bold" style={{ color: colors.text }}>
            −
          </Text>
        </TouchableOpacity>

        <View className="items-center">
          <Text
            className="text-base font-extrabold"
            style={{ color: colors.text }}
          >
            {n}
          </Text>
          <Text
            className="text-[9px] font-bold uppercase tracking-widest"
            style={{ color: colors.muted }}
          >
            {n === 1 ? "seat" : "seats"}
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setSeats(String(Math.min(8, n + 1)))}
          className="w-8 h-8 rounded-xl items-center justify-center shadow-sm"
          style={{ backgroundColor: colors.primary }}
        >
          <Text className="text-lg font-bold text-white">+</Text>
        </TouchableOpacity>
      </View>
      <FieldError message={error} />
    </View>
  );
}

function UploadCard({
  title,
  subtitle,
  file,
  icon,
  onPress,
  error,
  colors,
}: {
  title: string;
  subtitle: string;
  file: DocumentPicker.DocumentPickerAsset | null;
  icon: React.ReactNode;
  onPress: () => void;
  error?: string;
  colors: any;
}) {
  const uploaded = !!file;

  return (
    <View className="flex-1">
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        className="p-3.5 rounded-2xl border-[1.5px] border-dashed justify-between min-h-[125px]"
        style={{
          backgroundColor: uploaded ? colors.primarySoft : colors.input,
          borderColor: uploaded ? colors.primary : colors.border,
        }}
      >
        <View
          className="w-9 h-9 rounded-xl items-center justify-center"
          style={{ backgroundColor: colors.card }}
        >
          {uploaded ? <BadgeCheck size={18} color="#10B981" /> : icon}
        </View>

        <View className="mt-2">
          <Text
            className="text-xs font-bold"
            style={{ color: colors.text }}
            numberOfLines={1}
          >
            {title}
          </Text>
          <Text
            className="text-[11px] mt-0.5 leading-tight"
            style={{ color: colors.muted }}
            numberOfLines={2}
          >
            {uploaded ? file?.name : subtitle}
          </Text>
        </View>

        <Text
          className="text-[11px] font-bold mt-2"
          style={{ color: uploaded ? "#10B981" : colors.primary }}
        >
          {uploaded ? "✓ Uploaded" : "Tap to upload"}
        </Text>
      </TouchableOpacity>
      <FieldError message={error} />
    </View>
  );
}

// ─── Main Modal Component ─────────────────────────────────────────────────────

export function AddVehicleModal({
  visible,
  onClose,
  loading,
  onSubmit,
}: {
  visible: boolean;
  onClose: () => void;
  loading: boolean;
  onSubmit: (formData: FormData) => void;
}) {
  const { colors, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const stackInputs = screenWidth < 360;

  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [color, setColor] = useState("");
  const [seats, setSeats] = useState("4");
  const [rcFile, setRcFile] =
    useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [vehiclePhoto, setVehiclePhoto] =
    useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [errors, setErrors] = useState<VehicleFormErrors>({});

  const canSubmit = useMemo(
    () =>
      brand.trim().length > 0 &&
      model.trim().length > 0 &&
      registrationNumber.trim().length > 0 &&
      Number(seats) > 0 &&
      !!rcFile &&
      !!vehiclePhoto,
    [brand, model, registrationNumber, seats, rcFile, vehiclePhoto],
  );

  const clearError = (key: keyof VehicleFormErrors) =>
    setErrors((p) => ({ ...p, [key]: undefined }));

  const resetForm = () => {
    setBrand("");
    setModel("");
    setRegistrationNumber("");
    setColor("");
    setSeats("4");
    setRcFile(null);
    setVehiclePhoto(null);
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const pickFile = async (
    type: string[],
    setter: (f: DocumentPicker.DocumentPickerAsset) => void,
    fieldKey: keyof VehicleFormErrors,
  ) => {
    try {
      // 1. Optional: Request storage access permission if targeting older Android or specific scoped storage
      if (Platform.OS === "android") {
        // Expo document picker handles its own intent, but copying to cache
        // ensures we have local read access without scoped storage blocks.
      }

      const result = await DocumentPicker.getDocumentAsync({
        type,
        copyToCacheDirectory: true, // Crucial: ensures file is copied to app cache where you have read permission
        multiple: false,
      });

      if (result.canceled) return;
      const file = result.assets[0];

      if (file.size && file.size > 5 * 1024 * 1024) {
        setErrors((p) => ({ ...p, [fieldKey]: "Must be under 5 MB." }));
        return;
      }

      // 2. Verify read permissions/accessibility by checking info or reading a tiny bit
      // or simply letting cache copy handle it safely.
      clearError(fieldKey);
      setter(file);
    } catch (err) {
      console.error("Permission or picking error:", err);
      setErrors((p) => ({
        ...p,
        [fieldKey]: "Permission denied or couldn't read file.",
      }));
    }
  };

  const validate = (): boolean => {
    const e: VehicleFormErrors = {};
    if (!brand.trim()) e.brand = "Brand is required.";
    if (!model.trim()) e.model = "Model is required.";
    if (!registrationNumber.trim())
      e.registrationNumber = "Vehicle number is required.";
    if (!Number(seats) || Number(seats) < 1)
      e.seats = "At least 1 seat required.";
    if (!rcFile) e.rcFile = "RC document is required.";
    if (!vehiclePhoto) e.vehiclePhoto = "Vehicle photo is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const formData = new FormData();
    formData.append("vehicle_type", "car");
    formData.append("brand", brand.trim());
    formData.append("model", model.trim());
    formData.append(
      "registration_number",
      registrationNumber.trim().toUpperCase(),
    );
    formData.append("rc_number", registrationNumber.trim().toUpperCase());
    formData.append("color", color.trim() || "");
    formData.append("seats", String(Number(seats)));
    formData.append("available_seats", String(Number(seats)));

    if (rcFile) {
      try {
        // Attempt using the new File API first
        const rcFileObj = new File(rcFile.uri);
        formData.append(
          "rc_document",
          rcFileObj,
          rcFile.name || "rc-document.pdf",
        );
      } catch (e) {
        // Fallback gracefully for Expo Go / restricted content providers
        formData.append("rc_document", {
          uri: rcFile.uri,
          name: rcFile.name || "rc-document.pdf",
          type: rcFile.mimeType || "application/pdf",
        } as any);
      }
    }

    if (vehiclePhoto) {
      try {
        const photoFileObj = new File(vehiclePhoto.uri);
        formData.append(
          "vehicle_photo",
          photoFileObj,
          vehiclePhoto.name || "vehicle-photo.jpg",
        );
      } catch (e) {
        formData.append("vehicle_photo", {
          uri: vehiclePhoto.uri,
          name: vehiclePhoto.name || "vehicle-photo.jpg",
          type: vehiclePhoto.mimeType || "image/jpeg",
        } as any);
      }
    }

    onSubmit(formData);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      {Platform.OS === "ios" ? (
        <BlurView
          intensity={30}
          tint={isDark ? "dark" : "light"}
          className="absolute inset-0"
        />
      ) : (
        <View className="absolute inset-0 bg-black/60" />
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <View className="flex-1 justify-end">
          <TouchableOpacity
            activeOpacity={1}
            onPress={handleClose}
            className="flex-1"
          />

          <View
            className="rounded-t-[28px] border-t border-x overflow-hidden shadow-2xl"
            style={{
              backgroundColor: colors.card,
              borderColor: colors.border,
              paddingBottom: Math.max(insets.bottom, 16),
              maxHeight: "88%",
            }}
          >
            {/* Grab Handle */}
            <View className="items-center pt-3 pb-1">
              <View
                className="w-10 h-1 rounded-full opacity-40"
                style={{ backgroundColor: colors.border }}
              />
            </View>

            {/* Header */}
            <View
              className="flex-row items-center justify-between px-5 py-4 border-b"
              style={{ borderBottomColor: colors.border }}
            >
              <View className="flex-1 pr-3">
                <Text
                  className="text-lg font-extrabold tracking-tight"
                  style={{ color: colors.text }}
                >
                  Add Vehicle
                </Text>
                <Text
                  className="text-xs mt-0.5"
                  style={{ color: colors.muted }}
                >
                  Your vehicle will be reviewed before activation
                </Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleClose}
                disabled={loading}
                className="w-9 h-9 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.input }}
              >
                <X size={16} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              contentContainerStyle={{
                paddingHorizontal: 20,
                paddingTop: 18,
                paddingBottom: 10,
              }}
            >
              {/* Info Banner */}
              <View
                className="flex-row items-start gap-3 border rounded-2xl p-3.5 mb-4 shadow-sm"
                style={{
                  backgroundColor: colors.primarySoft,
                  borderColor: colors.border,
                }}
              >
                <ShieldCheck size={18} color={colors.primary} />
                <View className="flex-1">
                  <Text
                    className="text-xs font-bold"
                    style={{ color: colors.text }}
                  >
                    Verification Required
                  </Text>
                  <Text
                    className="text-[11px] mt-0.5 leading-relaxed"
                    style={{ color: colors.muted }}
                  >
                    Upload a clear RC document (PDF/Image, max 5MB). Approvals
                    usually take under 24 hours.
                  </Text>
                </View>
              </View>

              {/* Brand and Model */}
              <View className={stackInputs ? "flex-col" : "flex-row gap-3"}>
                <AppInput
                  colors={colors}
                  icon={<Car size={16} color={colors.primary} />}
                  label="Brand"
                  value={brand}
                  onChangeText={(v) => {
                    setBrand(v);
                    clearError("brand");
                  }}
                  placeholder="Hyundai"
                  error={errors.brand}
                />
                <AppInput
                  colors={colors}
                  icon={<Car size={16} color={colors.primary} />}
                  label="Model"
                  value={model}
                  onChangeText={(v) => {
                    setModel(v);
                    clearError("model");
                  }}
                  placeholder="i20"
                  error={errors.model}
                />
              </View>

              {/* Registration Number */}
              <AppInput
                colors={colors}
                icon={<Hash size={16} color={colors.primary} />}
                label="Vehicle Number"
                value={registrationNumber}
                onChangeText={(v) => {
                  setRegistrationNumber(v.toUpperCase());
                  clearError("registrationNumber");
                }}
                placeholder="OD 02 AB 1234"
                autoCapitalize="characters"
                error={errors.registrationNumber}
              />

              {/* Documents Upload Section */}
              <View className="mb-3.5">
                <FieldLabel label="Photos & Documents" colors={colors} />
                <View className="flex-row gap-3">
                  <UploadCard
                    colors={colors}
                    title="Vehicle Photo"
                    subtitle="Clear outside view"
                    file={vehiclePhoto}
                    icon={<Car size={16} color={colors.primary} />}
                    onPress={() =>
                      pickFile(["image/*"], setVehiclePhoto, "vehiclePhoto")
                    }
                    error={errors.vehiclePhoto}
                  />
                  <UploadCard
                    colors={colors}
                    title="RC Document"
                    subtitle="PDF or Image copy"
                    file={rcFile}
                    icon={<FileText size={16} color={colors.primary} />}
                    onPress={() =>
                      pickFile(
                        ["image/*", "application/pdf"],
                        setRcFile,
                        "rcFile",
                      )
                    }
                    error={errors.rcFile}
                  />
                </View>
              </View>

              {/* Color & Seats Row */}
              <View className="flex-row gap-3 items-start">
                <AppInput
                  colors={colors}
                  icon={<Palette size={16} color={colors.primary} />}
                  label="Color (Optional)"
                  value={color}
                  onChangeText={setColor}
                  placeholder="White"
                />
                <View className="flex-1">
                  <SeatSelector
                    colors={colors}
                    seats={seats}
                    setSeats={(v) => {
                      setSeats(v);
                      clearError("seats");
                    }}
                    error={errors.seats}
                  />
                </View>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                activeOpacity={0.8}
                disabled={loading}
                onPress={handleSubmit}
                className="flex-row items-center justify-center gap-2 rounded-2xl py-4 mt-2 mb-2 shadow-md"
                style={{
                  backgroundColor: canSubmit ? colors.primary : colors.input,
                  opacity: loading ? 0.75 : 1,
                }}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Plus size={16} color={canSubmit ? "#fff" : colors.muted} />
                    <Text
                      className="text-sm font-extrabold tracking-wide"
                      style={{ color: canSubmit ? "#fff" : colors.muted }}
                    >
                      {canSubmit
                        ? "Submit Vehicle"
                        : "Complete Required Fields"}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
