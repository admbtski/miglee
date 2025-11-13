import { InviteLinkPage } from './_components/invite-link-page';

export const metadata = {
  title: 'Zaproszenie do wydarzenia | Miglee',
  description: 'Dołącz do wydarzenia za pomocą linku zaproszeniowego',
};

export default function Page({ params }: { params: { code: string } }) {
  return <InviteLinkPage code={params.code} />;
}
