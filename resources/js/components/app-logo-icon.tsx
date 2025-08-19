import { HTMLAttributes  } from 'react';

export default function AppLogoIcon(props: HTMLAttributes<HTMLImageElement>) {
    return <img {...props} src="/icon/default.webp" alt="App Logo" />;
}
