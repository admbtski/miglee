/**
 * UI Components
 *
 * Reusable, generic UI components used across the application.
 */

// Core form elements
export { Button } from './button';
export { Checkbox } from './checkbox';
export { Input } from './input';
export { Label } from './label';
export { RadioGroup, RadioGroupItem } from './radio-group';
export {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';
export { Textarea } from './textarea';

// Display components
export { Avatar } from './avatar';
export { Badge } from './badge';
export { BlurHashImage } from './blurhash-image';

// Event-specific badges
export { CapacityBadge } from './capacity-badge';
export { CapacityProgressBar } from './capacity-progress-bar';
export { LevelBadge } from './level-badge';
export { StatusBadge } from './status-badge';
export { VerifiedBadge } from './verified-badge';

// Category & Tag pills
export {
  CategoryPills,
  Pill,
  TagPills,
  type PillSize,
  type PillVariant,
} from './category-tag-pill';
export {
  InlineCategoryPills,
  InlinePillsList,
  InlineTagPills,
} from './inline-category-tag-pill';

// Interactive components
export { ClickBurst } from './click-burst';
export { ClickParticle } from './click-particle';
export { CooldownRing } from './cooldown-ring';
export { FavouriteButton } from './favourite-button';
export { ReportButton } from './report-button';
export {
  SegmentedControl,
  type SegmentedControlProps,
  type SegmentedOption,
} from './segment-control';
export { ShareButton } from './share-button';

// Modals
export { DraftRestoreModal } from './draft-restore-modal';
export { ImageCropModal } from './image-crop-modal';
export { ShareModal } from './share-modal';

// Progress & Quota
export { QuotaBar } from './quota-bar';
export { SimpleProgressBar } from './simple-progress-bar';

// Plan theming
export {
  getShimmerOpacity,
  planAnimationConfig,
  shouldEnableAnimations,
} from './plan-animations';
export { planTheme } from './plan-theme';

// Icons
export { HybridLocationIcon } from './icons/hybrid-location-icon';
