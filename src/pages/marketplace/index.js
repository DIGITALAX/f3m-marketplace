import React, { useEffect, useState } from "react";
import {
  getCollectionGroups,
  getDigitalaxGarmentCollections,
} from "@services/api/apiService";
import styles from "./styles.module.scss";
import { useSelector } from "react-redux";
import PixelLoader from "@components/pixel-loader";
import { getChainId } from "@selectors/global.selectors";
import CollectionList from "@components/collection-list";
import HeroSection from "@components/hero-section";

const LandingPage = () => {
  const [filter, setFilter] = useState(null);
  const chainId = useSelector(getChainId);
  const [loading, setLoading] = useState(true);
  const [collectionGroups, setCollectionGroups] = useState([]);

  useEffect(() => {
    const fetchCollectionGroups = async () => {
      setLoading(true);
      const { digitalaxF3MCollectionGroups } = await getCollectionGroups(
        chainId
      );

      const collections = [];

      const sortedCollectionGroups = digitalaxF3MCollectionGroups.sort(
        (a, b) => {
          if (parseInt(a.id) > parseInt(b.id)) return -1;
          if (parseInt(a.id) === parseInt(b.id)) return 0;
          return 1;
        }
      );

      sortedCollectionGroups.forEach((digitalaxCollectionGroup) => {
        const collectionPrice = digitalaxCollectionGroup.collections.reduce(
          (a, b) => a + Number(b.valueSold),
          0
        );
        if (digitalaxCollectionGroup.collections?.length) {
          collections.push({
            ...digitalaxCollectionGroup.collections[0].garments[0],
            designer: digitalaxCollectionGroup.collections[0].designer,
            model: digitalaxCollectionGroup.collections[0].model,
            id: digitalaxCollectionGroup.id,
            sold: collectionPrice / 1e18,
            isAuction: false,
          });
        }
      });

      setCollectionGroups(
        [...collections].sort((a, b) => {
          if (parseInt(a.id) > parseInt(b.id)) return -1;
          if (parseInt(a.id) < parseInt(b.id)) return 1;
          return 0;
        })
      );
      setLoading(false);
    };

    fetchCollectionGroups();
  }, []);

  if (loading) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.loadingWrapper}>
          <PixelLoader title={"loading..."} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <HeroSection filter setFilter={(e) => setFilter(e)} />

      <section className={styles.collectionSection}>
        <div className={styles.collectionWrapper}>
          {!!collectionGroups?.length && (
            <CollectionList items={collectionGroups} />
          )}
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
