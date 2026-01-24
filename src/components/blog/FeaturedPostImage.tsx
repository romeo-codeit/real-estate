'use client';

import { useState } from 'react';
import Image from 'next/image';

interface FeaturedPostImageProps {
    src: string;
    alt: string;
    className?: string;
}

export function FeaturedPostImage({ src, alt, className }: FeaturedPostImageProps) {
    const [imgSrc, setImgSrc] = useState(src);

    return (
        <div className={className}>
            <img
                src={imgSrc}
                alt={alt}
                className="w-full h-full object-cover"
                onError={() => {
                    setImgSrc('/images/placeholder.svg');
                }}
            />
        </div>
    );
}
