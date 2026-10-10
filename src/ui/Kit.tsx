// Shared pieces used across the vendor screens (and reusable anywhere):
// steps, segmented tabs, empty states, bottom sheets, document sheets,
// photo pickers and upload boxes, stat tiles and skeletons.
import React, { ReactNode, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText, Button, IconButton, IconName, TextField } from './index';
import { MenuGroup, MenuRow } from './Menu';
import { brand, color, gutter, radius, shadow, themed } from '../theme';

/* ------------------------------------------------------------------ */
/* Steps                                                               */
/* ------------------------------------------------------------------ */

export const Steps = ({ steps, current, style }: { steps: string[]; current: number; style?: StyleProp<ViewStyle> }) => (
  <View style={[styles.steps, style]}>
    {steps.map((label, i) => {
      const n = i + 1;
      const done = n < current;
      const active = n === current;
      return (
        <React.Fragment key={label}>
          <View style={styles.step}>
            <View style={[styles.stepDot, (done || active) && styles.stepDotOn]}>
              {done ? (
                <Feather name="check" size={12} color="#FFFFFF" />
              ) : (
                <AppText variant="smallMedium" color={active ? '#FFFFFF' : color.muted} style={{ fontSize: 12 }}>
                  {n}
                </AppText>
              )}
            </View>
            <AppText variant="smallMedium" color={active ? color.ink : color.muted} style={{ fontSize: 13 }}>
              {label}
            </AppText>
          </View>
          {n < steps.length && <View style={[styles.stepLine, done && { backgroundColor: color.primary }]} />}
        </React.Fragment>
      );
    })}
  </View>
);

/* ------------------------------------------------------------------ */
/* Segmented tabs                                                      */
/* ------------------------------------------------------------------ */

export const Segmented = <K extends string>({
  options,
  value,
  onChange,
  style,
}: {
  options: { key: K; label: string; count?: number }[];
  value: K;
  onChange: (k: K) => void;
  style?: StyleProp<ViewStyle>;
}) => (
  <View style={[styles.segment, style]}>
    {options.map((o) => {
      const on = o.key === value;
      return (
        <Pressable key={o.key} onPress={() => onChange(o.key)} style={[styles.segmentItem, on && styles.segmentOn]} accessibilityRole="tab" accessibilityState={{ selected: on }}>
          <AppText variant="smallMedium" color={on ? color.ink : color.muted} style={{ fontSize: 13.5 }} numberOfLines={1}>
            {o.label}
          </AppText>
          {!!o.count && (
            <View style={[styles.count, on && { backgroundColor: color.primary }]}>
              <AppText variant="smallMedium" color={on ? '#FFFFFF' : color.muted} style={{ fontSize: 11, lineHeight: 14 }}>
                {o.count}
              </AppText>
            </View>
          )}
        </Pressable>
      );
    })}
  </View>
);

/* ------------------------------------------------------------------ */
/* Empty state and skeleton                                            */
/* ------------------------------------------------------------------ */

export const EmptyState = ({ icon, title, body, action }: { icon: IconName; title: string; body?: string; action?: ReactNode }) => (
  <View style={styles.empty}>
    <View style={styles.emptyIcon}>
      <Feather name={icon} size={24} color={color.primary} />
    </View>
    <AppText variant="heading" center style={{ marginTop: 16 }}>
      {title}
    </AppText>
    {!!body && (
      <AppText variant="body" color={color.muted} center style={{ marginTop: 6 }}>
        {body}
      </AppText>
    )}
    {!!action && <View style={{ marginTop: 20 }}>{action}</View>}
  </View>
);

export const Skeleton = ({ height = 120, style }: { height?: number; style?: StyleProp<ViewStyle> }) => (
  <View style={[{ height, borderRadius: radius.xl, backgroundColor: color.sunken, marginBottom: 12 }, style]} />
);

/* ------------------------------------------------------------------ */
/* Stat tile                                                           */
/* ------------------------------------------------------------------ */

export const StatTile = ({
  icon,
  label,
  value,
  hint,
  onPress,
  tone = 'blue',
  style,
}: {
  icon: IconName;
  label: string;
  value: string;
  hint?: string;
  onPress?: () => void;
  tone?: 'blue' | 'green' | 'amber' | 'slate';
  style?: StyleProp<ViewStyle>;
}) => {
  const t = {
    blue: { bg: color.primarySoft, fg: color.primary },
    green: { bg: color.successSoft, fg: color.success },
    amber: { bg: color.warningSoft, fg: color.warning },
    slate: { bg: color.sunken, fg: color.text },
  }[tone];
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => [styles.stat, shadow.sm, pressed && { opacity: 0.92 }, style]}>
      <View style={[styles.statIcon, { backgroundColor: t.bg }]}>
        <Feather name={icon} size={16} color={t.fg} />
      </View>
      <AppText variant="heading" style={{ marginTop: 12 }} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </AppText>
      <AppText variant="small" color={color.muted} numberOfLines={1}>
        {label}
      </AppText>
      {!!hint && (
        <AppText variant="small" color={t.fg} style={{ fontSize: 12, marginTop: 2 }} numberOfLines={1}>
          {hint}
        </AppText>
      )}
    </Pressable>
  );
};

/* ------------------------------------------------------------------ */
/* Pills                                                               */
/* ------------------------------------------------------------------ */

export type PillTone = 'blue' | 'green' | 'amber' | 'red' | 'slate' | 'violet';

const PILL: Record<PillTone, { bg: string; fg: string }> = themed(() => ({
  blue: { bg: color.primarySoft, fg: color.primary },
  green: { bg: color.successSoft, fg: color.success },
  amber: { bg: color.warningSoft, fg: color.warning },
  red: { bg: color.dangerSoft, fg: color.danger },
  slate: { bg: color.sunken, fg: color.text },
  violet: { bg: color.violetSoft, fg: color.violet },
}));

export const Pill = ({ label, tone = 'slate', icon, style }: { label: string; tone?: PillTone; icon?: IconName; style?: StyleProp<ViewStyle> }) => {
  const t = PILL[tone];
  return (
    <View style={[styles.pill, { backgroundColor: t.bg }, style]}>
      {icon ? <Feather name={icon} size={11} color={t.fg} /> : <View style={[styles.pillDot, { backgroundColor: t.fg }]} />}
      <AppText variant="smallMedium" color={t.fg} style={{ fontSize: 12 }}>
        {label}
      </AppText>
    </View>
  );
};

/** A car's review state, as vendors see it. */
export const carReview = (approval: string, isActive = true, status = 'available'): { label: string; tone: PillTone } => {
  if (approval === 'pending') return { label: 'In review', tone: 'amber' };
  if (approval === 'rejected') return { label: 'Needs changes', tone: 'red' };
  if (!isActive) return { label: 'Hidden', tone: 'slate' };
  if (status === 'maintenance') return { label: 'Maintenance', tone: 'slate' };
  return { label: 'Live', tone: 'green' };
};

/* ------------------------------------------------------------------ */
/* Bottom sheet                                                        */
/* ------------------------------------------------------------------ */

export const BottomSheet = ({
  visible,
  onClose,
  title,
  subtitle,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
}) => {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.handle} />
          {!!title && <AppText variant="heading">{title}</AppText>}
          {!!subtitle && (
            <AppText variant="small" color={color.muted} style={{ marginTop: 2 }}>
              {subtitle}
            </AppText>
          )}
          <View style={{ marginTop: title || subtitle ? 14 : 0 }}>{children}</View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

/* ------------------------------------------------------------------ */
/* Full page document (terms, privacy)                                 */
/* ------------------------------------------------------------------ */

export const DocSheet = ({
  visible,
  title,
  sections,
  updated,
  onClose,
  onAccept,
}: {
  visible: boolean;
  title: string;
  sections: { title: string; body: string }[];
  updated?: string;
  onClose: () => void;
  onAccept?: () => void;
}) => {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: color.bg }}>
        <View style={styles.docHeader}>
          <AppText variant="heading" style={{ flex: 1 }}>
            {title}
          </AppText>
          <IconButton icon="x" size={38} onPress={onClose} accessibilityLabel="Close" />
        </View>
        <ScrollView contentContainerStyle={{ padding: gutter, paddingBottom: 32 }}>
          {sections.map((s) => (
            <View key={s.title} style={{ marginBottom: 20 }}>
              <AppText variant="subheading" style={{ marginBottom: 6 }}>
                {s.title}
              </AppText>
              <AppText variant="body" color={color.text}>
                {s.body}
              </AppText>
            </View>
          ))}
          {!!updated && (
            <AppText variant="small" color={color.subtle}>
              Last updated {updated}
            </AppText>
          )}
        </ScrollView>
        {onAccept && (
          <View style={[styles.docFooter, { paddingBottom: insets.bottom + 16 }]}>
            <Button title="I accept" onPress={onAccept} />
          </View>
        )}
      </View>
    </Modal>
  );
};

/* ------------------------------------------------------------------ */
/* Photos                                                              */
/* ------------------------------------------------------------------ */

/**
 * Opens the camera or the photo library and returns the picked images, or null.
 * Call it while any sheet is still open and close the sheet afterwards: iOS will not
 * open the picker over a sheet that is in the middle of closing.
 * The photo library needs no permission prompt (the system picker handles privacy).
 */
export const pickImage = async (
  source: 'camera' | 'library',
  opts: { aspect?: [number, number]; edit?: boolean; quality?: number; multiple?: number } = {}
): Promise<string[] | null> => {
  try {
    if (source === 'camera') {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Camera access needed', 'Allow Escardia to use your camera in your phone settings.');
        return null;
      }
    }
    const multiple = source === 'library' && (opts.multiple ?? 1) > 1;
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      allowsEditing: !multiple && (opts.edit ?? true),
      aspect: opts.aspect,
      quality: opts.quality ?? 0.7,
      allowsMultipleSelection: multiple,
      selectionLimit: multiple ? opts.multiple : 1,
    };
    const result = source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
    if (result.canceled || !result.assets?.length) return null;
    return result.assets.map((a) => a.uri);
  } catch (e: any) {
    Alert.alert('Could not open your photos', e?.message || 'Please try again.');
    return null;
  }
};

/** "Take a photo / Choose from your photos" sheet. */
export const PhotoSourceSheet = ({
  visible,
  title = 'Add a photo',
  subtitle,
  onClose,
  onPick,
  onRemove,
}: {
  visible: boolean;
  title?: string;
  subtitle?: string;
  onClose: () => void;
  onPick: (source: 'camera' | 'library') => void;
  onRemove?: () => void;
}) => (
  <BottomSheet visible={visible} onClose={onClose} title={title} subtitle={subtitle}>
    <MenuGroup>
      <MenuRow icon="camera" label="Take a photo" onPress={() => onPick('camera')} />
      <MenuRow icon="image" label="Choose from your photos" onPress={() => onPick('library')} last={!onRemove} />
      {onRemove && <MenuRow icon="trash-2" label="Remove" danger onPress={onRemove} right={<View />} last />}
    </MenuGroup>
    <Button title="Cancel" variant="secondary" onPress={onClose} style={{ marginTop: 14 }} />
  </BottomSheet>
);

/** Tap-to-upload box for a document photo, with its own source sheet. */
export const UploadBox = ({
  label,
  hint,
  optional,
  uri,
  onChange,
  error,
  aspect = [4, 3],
  loading,
  removable = true,
}: {
  label: string;
  hint?: string;
  optional?: boolean;
  uri: string | null;
  onChange: (uri: string | null) => void;
  error?: string;
  aspect?: [number, number];
  loading?: boolean;
  removable?: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const pick = async (source: 'camera' | 'library') => {
    const r = await pickImage(source, { aspect });
    setOpen(false);
    if (r?.[0]) onChange(r[0]);
  };
  return (
    <View style={{ marginBottom: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <AppText variant="smallMedium" color={color.text}>
          {label}
        </AppText>
        {optional && (
          <AppText variant="small" color={color.subtle}>
            Optional
          </AppText>
        )}
      </View>
      <Pressable
        onPress={() => setOpen(true)}
        disabled={loading}
        style={({ pressed }) => [styles.upload, uri && styles.uploadFilled, !!error && { borderColor: color.danger }, pressed && { opacity: 0.9 }]}
        accessibilityRole="button"
        accessibilityLabel={uri ? `Change ${label}` : `Add ${label}`}
      >
        {loading ? (
          <ActivityIndicator color={color.primary} />
        ) : uri ? (
          <>
            <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            <View style={styles.uploadBadge}>
              <Feather name="check" size={12} color="#FFFFFF" />
              <AppText variant="smallMedium" color="#FFFFFF" style={{ fontSize: 12 }}>
                Added · Tap to change
              </AppText>
            </View>
          </>
        ) : (
          <>
            <View style={styles.uploadIcon}>
              <Feather name="upload" size={18} color={color.primary} />
            </View>
            <AppText variant="smallMedium" color={color.ink} style={{ marginTop: 10 }}>
              Take a photo or upload
            </AppText>
            {!!hint && (
              <AppText variant="small" color={color.muted} center style={{ marginTop: 2, paddingHorizontal: 16 }}>
                {hint}
              </AppText>
            )}
          </>
        )}
      </Pressable>
      {!!error && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
          <Feather name="alert-circle" size={13} color={color.danger} />
          <AppText variant="small" color={color.danger}>
            {error}
          </AppText>
        </View>
      )}
      <PhotoSourceSheet
        visible={open}
        title={label}
        subtitle="Make sure all four corners are in the shot and the text is easy to read."
        onClose={() => setOpen(false)}
        onPick={pick}
        onRemove={uri && removable ? () => (setOpen(false), onChange(null)) : undefined}
      />
    </View>
  );
};

/* ------------------------------------------------------------------ */
/* Choice chips                                                        */
/* ------------------------------------------------------------------ */

export const ChoiceChips = <K extends string>({
  options,
  value,
  onChange,
  style,
}: {
  options: { key: K; label: string; icon?: IconName }[];
  value: K | null;
  onChange: (k: K) => void;
  style?: StyleProp<ViewStyle>;
}) => (
  <View style={[{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, style]}>
    {options.map((o) => {
      const on = o.key === value;
      return (
        <Pressable key={o.key} onPress={() => onChange(o.key)} style={[styles.chip, on && styles.chipOn]} accessibilityRole="radio" accessibilityState={{ selected: on }}>
          {o.icon && <Feather name={o.icon} size={14} color={on ? '#FFFFFF' : color.text} />}
          <AppText variant="smallMedium" color={on ? '#FFFFFF' : color.ink} style={{ fontSize: 13.5 }}>
            {o.label}
          </AppText>
        </Pressable>
      );
    })}
  </View>
);

/* ------------------------------------------------------------------ */
/* Search picker                                                       */
/* ------------------------------------------------------------------ */

/** Bottom sheet list with search and an optional "use what I typed" row. */
export const SearchPicker = ({
  visible,
  title,
  options,
  value,
  allowCustom,
  onClose,
  onSelect,
}: {
  visible: boolean;
  title: string;
  options: string[];
  value: string;
  allowCustom?: boolean;
  onClose: () => void;
  onSelect: (v: string) => void;
}) => {
  const [q, setQ] = useState('');
  useEffect(() => {
    if (visible) setQ('');
  }, [visible]);
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? options.filter((o) => o.toLowerCase().includes(s)) : options;
  }, [q, options]);
  const custom = allowCustom && q.trim() && !options.some((o) => o.toLowerCase() === q.trim().toLowerCase());
  return (
    <BottomSheet visible={visible} onClose={onClose} title={title}>
      {options.length > 8 && (
        <TextField icon="search" placeholder="Search" value={q} onChangeText={setQ} autoCorrect={false} containerStyle={{ marginBottom: 8 }} />
      )}
      {!options.length && allowCustom && (
        <TextField placeholder={`Type the ${title.toLowerCase()}`} value={q} onChangeText={setQ} autoFocus containerStyle={{ marginBottom: 8 }} />
      )}
      <FlatList
        data={list}
        keyExtractor={(o) => o}
        style={{ maxHeight: 380 }}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          custom ? (
            <Pressable onPress={() => onSelect(q.trim())} style={styles.option}>
              <Feather name="plus" size={16} color={color.primary} />
              <AppText variant="bodyMedium" color={color.primary} style={{ flex: 1 }}>
                Use “{q.trim()}”
              </AppText>
            </Pressable>
          ) : null
        }
        renderItem={({ item }) => {
          const on = item === value;
          return (
            <Pressable onPress={() => onSelect(item)} style={({ pressed }) => [styles.option, pressed && { backgroundColor: color.sunken }]}>
              <AppText variant={on ? 'bodyMedium' : 'body'} color={on ? color.primary : color.ink} style={{ flex: 1 }}>
                {item}
              </AppText>
              {on && <Feather name="check" size={18} color={color.primary} />}
            </Pressable>
          );
        }}
      />
      <Button title="Cancel" variant="secondary" onPress={onClose} style={{ marginTop: 10 }} />
    </BottomSheet>
  );
};

const styles = themed(() => StyleSheet.create({
  option: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 13, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: color.border },
  steps: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stepDot: { width: 22, height: 22, borderRadius: 11, backgroundColor: color.sunken, alignItems: 'center', justifyContent: 'center' },
  stepDotOn: { backgroundColor: color.primary },
  stepLine: { flex: 1, height: 2, borderRadius: 1, backgroundColor: color.border, marginHorizontal: 8 },
  segment: { flexDirection: 'row', padding: 4, borderRadius: radius.lg, backgroundColor: color.sunken },
  segmentItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 38, borderRadius: radius.md, paddingHorizontal: 4 },
  segmentOn: { backgroundColor: color.surface, ...shadow.sm },
  count: { minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 5, backgroundColor: color.border, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingVertical: 40 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: color.primarySoft, alignItems: 'center', justifyContent: 'center' },
  stat: { flex: 1, backgroundColor: color.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: color.border, padding: 14 },
  statIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: 9, height: 24, borderRadius: 12 },
  pillDot: { width: 6, height: 6, borderRadius: 3 },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: color.overlay },
  sheet: { backgroundColor: color.surface, borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl, paddingHorizontal: gutter, paddingTop: 10, maxHeight: '92%' },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: color.border, marginBottom: 14 },
  docHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: gutter,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: color.border,
    backgroundColor: color.surface,
  },
  docFooter: { paddingHorizontal: gutter, paddingTop: 12, borderTopWidth: 1, borderTopColor: color.border, backgroundColor: color.surface },
  upload: {
    height: 150,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: color.primaryLine,
    backgroundColor: color.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  uploadFilled: { borderStyle: 'solid', borderColor: color.border, backgroundColor: color.sunken },
  uploadIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: color.surface, alignItems: 'center', justifyContent: 'center' },
  uploadBadge: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(11,21,48,0.78)',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.surface,
  },
  chipOn: { backgroundColor: color.primary, borderColor: color.primary },
}));
