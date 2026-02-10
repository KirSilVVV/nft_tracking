// SocialLinks - Social media icons for identity
// Compact display of Twitter, Farcaster, Lens links

import React from 'react';
import { WalletIdentity } from '../../types/identity.types';
import './SocialLinks.css';

interface SocialLinksProps {
  identity: WalletIdentity;
  size?: 'small' | 'medium' | 'large';
}

const SocialLinks: React.FC<SocialLinksProps> = ({ identity, size = 'medium' }) => {
  const hasSocials = identity.twitter || identity.farcaster || identity.lens || identity.website;

  if (!hasSocials) return null;

  return (
    <div className={`social-links social-links-${size}`}>
      {identity.twitter && (
        <a
          href={`https://twitter.com/${identity.twitter}`}
          target="_blank"
          rel="noopener noreferrer"
          className="social-link social-link-twitter"
          title={`@${identity.twitter} on Twitter`}
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </a>
      )}

      {identity.farcaster && (
        <a
          href={`https://warpcast.com/${identity.farcaster}`}
          target="_blank"
          rel="noopener noreferrer"
          className="social-link social-link-farcaster"
          title={`${identity.farcaster} on Farcaster`}
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.8 4H3.2C2.54 4 2 4.54 2 5.2v13.6c0 .66.54 1.2 1.2 1.2h17.6c.66 0 1.2-.54 1.2-1.2V5.2c0-.66-.54-1.2-1.2-1.2zM8 16l-3-3 3-3v6zm8 0V10l3 3-3 3z" />
          </svg>
        </a>
      )}

      {identity.lens && (
        <a
          href={`https://hey.xyz/u/${identity.lens}`}
          target="_blank"
          rel="noopener noreferrer"
          className="social-link social-link-lens"
          title={`${identity.lens} on Lens`}
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
        </a>
      )}

      {identity.website && (
        <a
          href={identity.website}
          target="_blank"
          rel="noopener noreferrer"
          className="social-link social-link-website"
          title="Website"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
          </svg>
        </a>
      )}

      {/* Etherscan link */}
      <a
        href={`https://etherscan.io/address/${identity.address}`}
        target="_blank"
        rel="noopener noreferrer"
        className="social-link social-link-etherscan"
        title="View on Etherscan"
      >
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z" />
        </svg>
      </a>
    </div>
  );
};

export default SocialLinks;
