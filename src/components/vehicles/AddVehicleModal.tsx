import { useAppTheme } from "@/theme/ThemeProvider";
import { BlurView } from "expo-blur";
import * as DocumentPicker from "expo-document-picker";
import { File } from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
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
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Keyboard,
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

type PickedFile = {
  uri: string;
  name: string;
  mimeType: string;
  size?: number;
};

const MAX_FILE_BYTES = 5 * 1024 * 1024;

// React Native's FormData expects this { uri, name, type } shape for files.
const appendFile = (fd: FormData, field: string, file: PickedFile) => {
  fd.append(field, new File(file.uri) as any, file.name);
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
  stacked = false,
  inputRef,
  returnKeyType = "next",
  onSubmitEditing,
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
  stacked?: boolean;
  inputRef?: React.Ref<React.ElementRef<typeof TextInput>>;
  returnKeyType?: "next" | "done";
  onSubmitEditing?: () => void;
}) {
  return (
    // flex-1 inside a column with auto height can collapse, so only use it in rows
    <View className={stacked ? "mb-3.5" : "flex-1 mb-3.5"}>
      <FieldLabel label={label} colors={colors} />
      <View
        className="flex-row items-center gap-3 px-3.5 rounded-2xl border min-h-[50px]"
        style={{
          backgroundColor: colors.input,
          borderColor: error ? "#EF4444" : colors.border,
        }}
      >
        <View className="opacity-70">{icon}</View>
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          submitBehavior={returnKeyType === "next" ? "submit" : "blurAndSubmit"}
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
  file: PickedFile | null;
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
          borderColor: error
            ? "#EF4444"
            : uploaded
              ? colors.primary
              : colors.border,
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
          {uploaded ? "✓ Uploaded (tap to change)" : "Tap to upload"}
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
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const stackInputs = screenWidth < 360;

  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [color, setColor] = useState("");
  const [seats, setSeats] = useState("4");
  const [rcFile, setRcFile] = useState<PickedFile | null>(null);
  const [vehiclePhoto, setVehiclePhoto] = useState<PickedFile | null>(null);
  const [errors, setErrors] = useState<VehicleFormErrors>({});
  const [kbHeight, setKbHeight] = useState(0);

  const modelRef = useRef<React.ElementRef<typeof TextInput>>(null);
  const regRef = useRef<React.ElementRef<typeof TextInput>>(null);

  const restingPadding = Math.max(insets.bottom, 16);
  const paddingAnim = useRef(new Animated.Value(restingPadding)).current;

  // Android Modals ignore the window resize mode, so track the keyboard
  // ourselves and animate the sheet instead of letting it jump.
  useEffect(() => {
    const showEvt =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvt =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const show = Keyboard.addListener(showEvt, (e) => {
      setKbHeight(e.endCoordinates.height);
      Animated.timing(paddingAnim, {
        toValue: e.endCoordinates.height,
        duration: Platform.OS === "ios" ? (e.duration ?? 250) : 180,
        useNativeDriver: false,
      }).start();
    });
    const hide = Keyboard.addListener(hideEvt, (e) => {
      setKbHeight(0);
      Animated.timing(paddingAnim, {
        toValue: restingPadding,
        duration: Platform.OS === "ios" ? (e?.duration ?? 250) : 180,
        useNativeDriver: false,
      }).start();
    });

    return () => {
      show.remove();
      hide.remove();
    };
  }, [paddingAnim, restingPadding]);

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

  // Backdrop tap and Android Back: hide the keyboard first, close on the next press.
  // The draft is kept; the parent remounts this modal (key) after a successful submit.
  const handleDismiss = () => {
    if (kbHeight > 0) {
      Keyboard.dismiss();
      return;
    }
    onClose();
  };

  const handleCloseButton = () => {
    Keyboard.dismiss();
    onClose();
  };

  // Vehicle photo: system photo picker, no storage permission needed.
  const pickPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.7,
        allowsMultipleSelection: false,
      });

      if (result.canceled) return;
      const asset = result.assets[0];

      if (asset.fileSize && asset.fileSize > MAX_FILE_BYTES) {
        setErrors((p) => ({ ...p, vehiclePhoto: "Must be under 5 MB." }));
        return;
      }

      clearError("vehiclePhoto");
      setVehiclePhoto({
        uri: asset.uri,
        name: asset.fileName || `vehicle-${Date.now()}.jpg`,
        mimeType: asset.mimeType || "image/jpeg",
        size: asset.fileSize,
      });
    } catch (err) {
      console.error("Photo pick error:", err);
      setErrors((p) => ({
        ...p,
        vehiclePhoto: "Couldn't read the photo. Try another one.",
      }));
    }
  };

  // RC document: PDF or image, copied to cache so the app can read it.
  const pickRc = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*", "application/pdf"],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) return;
      const asset = result.assets[0];

      if (asset.size && asset.size > MAX_FILE_BYTES) {
        setErrors((p) => ({ ...p, rcFile: "Must be under 5 MB." }));
        return;
      }

      clearError("rcFile");
      setRcFile({
        uri: asset.uri,
        name: asset.name || "rc-document.pdf",
        mimeType: asset.mimeType || "application/pdf",
        size: asset.size,
      });
    } catch (err) {
      console.error("RC pick error:", err);
      setErrors((p) => ({
        ...p,
        rcFile: "Couldn't read the file. Try another one.",
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

  const handleSubmit = () => {
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
    formData.append("color", color.trim());
    formData.append("seats", String(Number(seats)));
    formData.append("available_seats", String(Number(seats)));

    if (rcFile) appendFile(formData, "rc_document", rcFile);
    if (vehiclePhoto) appendFile(formData, "vehicle_photo", vehiclePhoto);

    if (__DEV__) {
      // Each file must show a uri, name and type, or React Native rejects the part.
      console.log(
        "FORM PARTS:",
        JSON.stringify(
          (formData as any)._parts?.map(([k, v]: [string, any]) => [
            k,
            typeof v === "string"
              ? v
              : { uri: v?.uri, name: v?.name, type: v?.type },
          ]),
          null,
          2,
        ),
      );
    }

    Keyboard.dismiss();
    onSubmit(formData);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={handleDismiss}
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

      <View className="flex-1 justify-end">
        <TouchableOpacity
          activeOpacity={1}
          onPress={handleDismiss}
          className="flex-1"
        />

        <Animated.View
          className="rounded-t-[28px] border-t border-x overflow-hidden shadow-2xl"
          style={{
            backgroundColor: colors.card,
            borderColor: colors.border,
            // animated lift above the keyboard, kept inside the screen
            paddingBottom: paddingAnim,
            maxHeight: screenHeight - insets.top - 24,
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
              <Text className="text-xs mt-0.5" style={{ color: colors.muted }}>
                Your vehicle will be reviewed before activation
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleCloseButton}
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
                stacked={stackInputs}
                icon={<Car size={16} color={colors.primary} />}
                label="Brand"
                value={brand}
                onChangeText={(v) => {
                  setBrand(v);
                  clearError("brand");
                }}
                placeholder="Hyundai"
                error={errors.brand}
                onSubmitEditing={() => modelRef.current?.focus()}
              />
              <AppInput
                colors={colors}
                stacked={stackInputs}
                icon={<Car size={16} color={colors.primary} />}
                label="Model"
                value={model}
                onChangeText={(v) => {
                  setModel(v);
                  clearError("model");
                }}
                placeholder="i20"
                error={errors.model}
                inputRef={modelRef}
                onSubmitEditing={() => regRef.current?.focus()}
              />
            </View>

            {/* Registration Number */}
            <AppInput
              colors={colors}
              stacked
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
              inputRef={regRef}
              returnKeyType="done"
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
                  onPress={pickPhoto}
                  error={errors.vehiclePhoto}
                />
                <UploadCard
                  colors={colors}
                  title="RC Document"
                  subtitle="PDF or Image copy"
                  file={rcFile}
                  icon={<FileText size={16} color={colors.primary} />}
                  onPress={pickRc}
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
                returnKeyType="done"
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
                    {canSubmit ? "Submit Vehicle" : "Complete Required Fields"}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}
