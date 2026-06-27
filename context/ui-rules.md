# UI Rules & Conventions

## Theme Adherence
- Color configurations must resolve via the `useColorScheme` state or `useThemeColor` helper hook.
- Do not use raw color hex strings directly within style definitions in `app/`. Use colors from `@/constants/Colors` or theme mappings.

## Layout Responsiveness
- Interface dimensions must adapt dynamically to device orientation changes.
- Root elements of screen components should listen to layout boundaries using `onLayout={(e) => ...}` to calculate rendering areas.
- Video containers and visualization boxes must adjust their scale and layout position using React Native's `Animated` library with spring properties.

## Interactive Touch Targets
- All pressable/touchable components (`TouchableOpacity`, `TouchableWithoutFeedback`) must respect mobile touch target guidelines:
  - Minimum height: `44` points/pixels.
  - Minimum width: `44` points/pixels.

## Typography Hierarchy
- Set precise `lineHeight` for larger font sizes to avoid vertical overlapping on smaller screens.
- Keep text color readable: ensure contrast ratios are at least 4.5:1 on background surfaces.
