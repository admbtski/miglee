import { Metadata } from 'next';
import { PublicProfileClient } from './_components/public-profile-client';
import { gqlClient } from '@/lib/api/client';
import { GetUserProfileDocument } from '@/lib/api/__generated__/react-query-update';

type Props = {
  params: { name: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const username = decodeURIComponent(params.name);

  try {
    // Fetch user data for metadata
    const data = await gqlClient.request(GetUserProfileDocument, {
      name: username,
    });

    const user = data.user;
    if (!user) {
      return {
        title: `User not found - Miglee`,
        description: `The user @${username} could not be found on Miglee`,
      };
    }

    const displayName = user.profile?.displayName || user.name;
    const bioShort = user.profile?.bioShort || '';
    const city = user.profile?.city;
    const country = user.profile?.country;
    const location = [city, country].filter(Boolean).join(', ');
    const imageUrl = user.imageUrl || '/default-avatar.png';
    const coverUrl = user.profile?.coverUrl;

    const title = `${displayName} (@${user.name}) - Miglee`;
    const description =
      bioShort ||
      `View ${displayName}'s profile on Miglee${location ? ` from ${location}` : ''}`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'profile',
        url: `https://miglee.com/u/${user.name}`,
        images: [
          {
            url: coverUrl || imageUrl,
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
        images: [coverUrl || imageUrl],
      },
      alternates: {
        canonical: `https://miglee.com/u/${user.name}`,
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: `@${username} - Miglee`,
      description: `View ${username}'s profile on Miglee`,
    };
  }
}

export default function PublicProfilePage({ params }: Props) {
  const username = decodeURIComponent(params.name);

  return <PublicProfileClient username={username} />;
}
