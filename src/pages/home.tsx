import React from "react";
import { Link } from "@/components/Link";
import { Button } from "@/components/Button";
import styles from "./nav.module.css";
import HeroGif from "@/assets/gifs/hero2.gif";

export default function Home() {
  return (
    <header className={styles.header}>
      <div className={styles.headerNavContainer}>
        <div className={styles.headerLeft}>
          <a>AI Buddy</a>
        </div>
        <div className={styles.headerRight}>
          <nav className={styles.headerNav}>
            <ul className={styles.headerNavUl}>
              <li>
                <a href="/home">Home</a>
              </li>
              <li>
                <a href="/features">Features</a>
              </li>
              <li>
                <a href="/pricing">Pricing</a>
              </li>
              <li>
                <Link href="/login" variant={"outline"}>
                  Login
                </Link>
              </li>
              <li>
                <Link href="/login">Sign Up</Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      <div className={styles.headerHeroContainer}>
        <h1 className={styles.headerHero_h1}>Open Source & Hosted AI Chat</h1>
        <h2 className={styles.headerHero_h2}>
          Integrations, Improved UI &amp; More...
        </h2>
        <div className={styles.headerHeroImageContainer}>
          <img src={HeroGif.src} className={styles.headerHeroImage} />
        </div>
        <Link href="/login" style={{ marginTop: 30 }} size={"xlg"}>
          Get Started Today
        </Link>
      </div>
    </header>
  );
}
