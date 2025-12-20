// TODO i18n: Metadata strings need translation keys
// - "User not found", "View profile", descriptions

import type { Metadata } from 'next';

// Features
import { PublicProfileClient } from '@/features/public-profile';

// Utils
import { buildAvatarUrl, buildUserCoverUrl } from '@/lib/media/url';
import { fetchUserProfile } from '@/features/public-profile';

type Props = {
  params: Promise<{ name: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { name } = await params;
  const username = decodeURIComponent(name);

  try {
    // Fetch user data for metadata
    const data = await fetchUserProfile({ name: username });

    const user = data.user;
    if (!user) {
      return {
        title: `User not found - Appname`,
        description: `The user @${username} could not be found on Appname`,
      };
    }

    const displayName = user.profile?.displayName || user.name;
    const bioShort = user.profile?.bioShort || '';
    const city = user.profile?.city;
    const country = user.profile?.country;
    const location = [city, country].filter(Boolean).join(', ');
    const avatarUrl = buildAvatarUrl(user.avatarKey, 'xl') || '';
    const coverUrl =
      buildUserCoverUrl(user.profile?.coverKey, 'detail') || avatarUrl;

    const title = `${displayName} (@${user.name}) - Appname`;
    const description =
      bioShort ||
      `View ${displayName}'s profile on Appname${location ? ` from ${location}` : ''}`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'profile',
        url: `https://appname.com/u/${user.name}`,
        images: [
          {
            url: coverUrl,
            width: 1200,
            height: 630,
            alt: `${displayName}'s profile`,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [coverUrl],
      },
      alternates: {
        canonical: `https://appname.com/u/${user.name}`,
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: `@${username} - Appname`,
      description: `View ${username}'s profile on Appname`,
    };
  }
}

export default async function PublicProfilePage({ params }: Props) {
  const { name } = await params;
  const username = decodeURIComponent(name);

  return <PublicProfileClient username={username} />;
}
