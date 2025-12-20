import { InviteLinkPage } from './_components/invite-link-page';

// TODO: Add i18n for metadata
export const metadata = {
  title: 'Zaproszenie do wydarzenia | Appname',
  description: 'Dołącz do wydarzenia za pomocą linku zaproszeniowego',
};

export default async function Page({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return <InviteLinkPage code={code} />;
}
