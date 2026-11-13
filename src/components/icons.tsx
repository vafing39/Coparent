import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

type IconProps = { size?: number; color: string };

export function AppleIcon({ size = 18, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M16.4 12.6c0-2.4 2-3.6 2.1-3.7-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.7.9-.8 0-1.9-.9-3.2-.8-1.6 0-3.1 1-4 2.4-1.7 3-.4 7.4 1.2 9.8.8 1.2 1.8 2.5 3 2.4 1.2 0 1.7-.8 3.1-.8 1.5 0 1.9.8 3.2.8 1.3 0 2.2-1.2 3-2.4.9-1.4 1.3-2.7 1.3-2.8 0 0-2.5-1-2.5-3.9zM14 5.5c.7-.8 1.1-1.9 1-3-1 0-2.1.6-2.8 1.4-.6.7-1.2 1.8-1 2.9 1 .1 2.1-.5 2.8-1.3z" />
    </Svg>
  );
}

type StrokeIconProps = IconProps & { strokeWidth?: number };

export function MailIcon({
  size = 40,
  color,
  strokeWidth = 1.8,
}: StrokeIconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Rect x={2} y={4} width={20} height={16} rx={2} />
      <Path d="M22 7l-10 6L2 7" />
    </Svg>
  );
}

export function CheckIcon({
  size = 16,
  color,
  strokeWidth = 2.6,
}: StrokeIconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M20 6L9 17l-5-5" />
    </Svg>
  );
}

export function ChevronLeftIcon({
  size = 24,
  color,
  strokeWidth = 2,
}: StrokeIconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M15 6l-6 6 6 6" />
    </Svg>
  );
}

export function InfoIcon({
  size = 22,
  color,
  strokeWidth = 2,
}: StrokeIconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Circle cx={12} cy={12} r={10} />
      <Path d="M12 16v-5M12 8h.01" />
    </Svg>
  );
}

export function PlusIcon({
  size = 18,
  color,
  strokeWidth = 2.4,
}: StrokeIconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M12 5v14M5 12h14" />
    </Svg>
  );
}

export function CloseIcon({
  size = 20,
  color,
  strokeWidth = 2,
}: StrokeIconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M18 6L6 18M6 6l12 12" />
    </Svg>
  );
}

export function EyeIcon({
  size = 22,
  color,
  strokeWidth = 2,
}: StrokeIconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <Circle cx={12} cy={12} r={3} />
    </Svg>
  );
}

export function EyeOffIcon({
  size = 22,
  color,
  strokeWidth = 2,
}: StrokeIconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M10.6 5.1A10.8 10.8 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-2.6 3.6M6.6 6.6A17.4 17.4 0 0 0 2 12s3.5 7 10 7a9.9 9.9 0 0 0 5.4-1.6" />
      <Path d="M9.9 9.9a3 3 0 0 0 4.2 4.2M2 2l20 20" />
    </Svg>
  );
}

export function ClockIcon({
  size = 20,
  color,
  strokeWidth = 2,
}: StrokeIconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Circle cx={12} cy={12} r={10} />
      <Path d="M12 6v6l4 2" />
    </Svg>
  );
}

export function ShareIcon({
  size = 20,
  color,
  strokeWidth = 2,
}: StrokeIconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <Path d="M16 6l-4-4-4 4M12 2v13" />
    </Svg>
  );
}

export function CopyIcon({
  size = 18,
  color,
  strokeWidth = 2,
}: StrokeIconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Rect x={9} y={9} width={13} height={13} rx={2} />
      <Path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </Svg>
  );
}

// Icônes de la barre d'onglets.

function TabIcon({
  size = 22,
  color,
  strokeWidth = 2,
  children,
}: StrokeIconProps & { children: React.ReactNode }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </Svg>
  );
}

export function HomeIcon(props: StrokeIconProps) {
  return (
    <TabIcon {...props}>
      <Path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
    </TabIcon>
  );
}

export function CalendarIcon(props: StrokeIconProps) {
  return (
    <TabIcon {...props}>
      <Rect x={3} y={4} width={18} height={18} rx={2} />
      <Path d="M16 2v4M8 2v4M3 10h18" />
    </TabIcon>
  );
}

export function MessageIcon(props: StrokeIconProps) {
  return (
    <TabIcon {...props}>
      <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </TabIcon>
  );
}

export function FamilyIcon(props: StrokeIconProps) {
  return (
    <TabIcon {...props}>
      <Circle cx={8} cy={6} r={2.5} />
      <Circle cx={16} cy={6} r={2.5} />
      <Circle cx={12} cy={13} r={2} />
      <Path d="M4 21v-5a4 4 0 0 1 4-4M20 21v-5a4 4 0 0 0-4-4M9 21v-2a3 3 0 0 1 6 0v2" />
    </TabIcon>
  );
}

export function EuroIcon(props: StrokeIconProps) {
  return (
    <TabIcon {...props}>
      <Path d="M4 10h11M4 14h9" />
      <Path d="M19 6a7.7 7.7 0 0 0-5.2-2A7.9 7.9 0 0 0 6 12c0 4.4 3.5 8 7.8 8 2 0 3.8-.8 5.2-2" />
    </TabIcon>
  );
}

export function ArrowRightIcon({
  size = 20,
  color,
  strokeWidth = 2,
}: StrokeIconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M5 12h14M13 6l6 6-6 6" />
    </Svg>
  );
}

/** Liste cochée (« Sac à préparer »). */
export function ChecklistIcon(props: StrokeIconProps) {
  return (
    <TabIcon size={20} {...props}>
      <Path d="M9 11l3 3L22 4" />
      <Path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </TabIcon>
  );
}

export function ChevronRightIcon(props: StrokeIconProps) {
  return (
    <TabIcon size={18} {...props}>
      <Path d="M9 6l6 6-6 6" />
    </TabIcon>
  );
}

export function BellIcon(props: StrokeIconProps) {
  return (
    <TabIcon {...props}>
      <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <Path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </TabIcon>
  );
}

export function LockIcon(props: StrokeIconProps) {
  return (
    <TabIcon strokeWidth={2.6} {...props}>
      <Rect x={3} y={11} width={18} height={11} rx={2} />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </TabIcon>
  );
}

/** Flèche vers le haut : « Envoyer ». */
export function SendIcon(props: StrokeIconProps) {
  return (
    <TabIcon {...props}>
      <Path d="M12 19V5M5 12l7-7 7 7" />
    </TabIcon>
  );
}

/** Roue dentée : compte et réglages (en haut de l'accueil). */
export function GearIcon(props: StrokeIconProps) {
  return (
    <TabIcon {...props}>
      <Circle cx={12} cy={12} r={3} />
      <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </TabIcon>
  );
}
