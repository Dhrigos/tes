import { Head } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { usePage } from '@inertiajs/react';

interface UnauthorizedPageProps {
  title?: string;
  message?: string;
}

interface PageProps {
  title?: string;
  message?: string;
  [key: string]: any;
}

export default function UnauthorizedPage({ title, message }: UnauthorizedPageProps) {
  const { props } = usePage<PageProps>();
  const pageTitle = title || props?.title || 'Akses Ditolak';
  const pageMessage = message || props?.message || 'Anda tidak memiliki izin untuk mengakses halaman ini.';
  
  const handleGoBack = () => {
    window.history.back();
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <>
      <Head title={pageTitle} />
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <svg className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <CardTitle className="mt-4 text-2xl font-bold text-gray-900">{pageTitle}</CardTitle>
            <CardDescription className="mt-2 text-gray-600">{pageMessage}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button onClick={handleGoBack} variant="outline" className="w-full sm:w-auto">
                Kembali
              </Button>
              <Button onClick={handleGoHome} className="w-full sm:w-auto">
                Ke Beranda
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
