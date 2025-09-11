export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
}

export interface PageProps {
    [key: string]: any;
    auth: {
        user: User;
    };
}

export type SharedData = PageProps;

// Additional commonly used app types
export type StatItem = {
    value: string | number;
    label: string;
    color: string;
    icon?: any;
    footer?: {
        text: string;
        href?: string;
    };
};

export type DashboardProps = {
    stats: StatItem[];
};

export interface NavItem {
    title: string;
    href?: string;
    icon?: any | null;
    isActive?: boolean;
    children?: NavItem[];
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}
