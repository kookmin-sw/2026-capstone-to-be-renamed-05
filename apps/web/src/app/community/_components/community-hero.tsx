import styles from './community-hero.module.css';

export function CommunityHero() {
  return (
    <div className={styles.hero}>
      <div className={styles.inner}>
        <div className={styles.textBlock}>
          <h1 className={styles.title}>커뮤니티</h1>
          <p className={styles.desc}>
            CPA 준비생부터 현직 회계사까지,
            <br />
            경험과 정보를 나누는 공간입니다.
          </p>
        </div>
      </div>
      <div className={styles.bgDecoration} aria-hidden="true" />
    </div>
  );
}
