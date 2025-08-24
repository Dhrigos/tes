import { useState } from "react";
import { Button } from '@/components/ui/button';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type StatItem, type DashboardProps } from '@/types';
import { Head,Link } from '@inertiajs/react';



const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

export default function Dashboard({ stats }: DashboardProps) {
    const [open, setOpen] = useState(false);
    const [modalContent, setModalContent] = useState<string>("");

    const handleOpenModal = (text: string) => {
        setModalContent(text);
        setOpen(true);
    };
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="h-full flex-1 flex flex-col gap-4 rounded-xl p-4">
                {/* Grid Section */}
                <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                    {stats.map((item: StatItem, idx) => (
                        <div
                        key={idx}
                        className={`rounded-lg p-4 text-white shadow-md ${item.color}`}
                        >
                        {/* Top */}
                        <div className="flex justify-between items-start">
                            <div className="text-2xl font-bold">{item.value}</div>
                            {item.icon}
                        </div>
                        {/* Label */}
                        <div className="mt-2 text-sm font-medium">{item.label}</div>
                        {/* Footer link */}
                        {item.footer ? (
                            <button
                                onClick={() => handleOpenModal(item.footer!.text)}
                                className="mt-4 text-xs flex justify-between items-center w-full hover:underline"
                                >
                                {item.footer.text}
                                <span>➔</span>
                            </button>
                        ) : null}

                        </div>
                    ))}
                </div>


                {/* Content Section */}
                <div className="relative flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 md:min-h-min dark:border-sidebar-border">
                    <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                </div>
            </div>
            {/* Modal */}
            {open && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
                <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 shadow-xl max-w-sm w-full">
                    <h2 className="text-lg font-semibold mb-4">Modal Content</h2>
                    <p className="mb-4">{modalContent}</p>
                    <Button onClick={() => setOpen(false)}>Close</Button>
                </div>
                </div>
            )}
        </AppLayout>
    );
}
