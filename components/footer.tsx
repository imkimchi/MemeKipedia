import Link from 'next/link'
import Image from 'next/image'

export function Footer() {
  return (
    <footer className="border-t border-slate-700 bg-slate-800">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div>
            <Image src="/logo-new.png" alt="Memekipedia" width={150} height={40} />
            <p className="mt-2 text-sm text-slate-400">
              A Web3-powered wiki platform for the community, by the community.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-100">Platform</h4>
            <ul className="mt-2 space-y-2">
              <li>
                <Link href="/wiki" className="text-sm text-slate-400 hover:text-slate-100">
                  Browse Wikis
                </Link>
              </li>
              <li>
                <Link href="/wiki/new" className="text-sm text-slate-400 hover:text-slate-100">
                  Create Wiki
                </Link>
              </li>
              <li>
                <Link href="/bounty" className="text-sm text-slate-400 hover:text-slate-100">
                  Bounties
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-100">Resources</h4>
            <ul className="mt-2 space-y-2">
              <li>
                <Link href="/docs" className="text-sm text-slate-400 hover:text-slate-100">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-sm text-slate-400 hover:text-slate-100">
                  About
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-slate-400 hover:text-slate-100"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-slate-700 pt-8">
          <p className="text-center text-sm text-slate-400">
            © {new Date().getFullYear()} Memekipedia. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
