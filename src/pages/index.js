import React, { useEffect, useState } from "react";
import { Router } from "next/router";
import Head from "next/head";
import {
  getAllNFTs,
  getCollectionGroups,
  getDigitalaxMarketplaceV3Offers,
  getNFTById,
  getSecondaryOrderByContractTokenAndBuyorsell,
  getSellingNfts,
} from "@services/api/apiService";
import PixelLoader from "@components/pixel-loader";
import styles from "./styles.module.scss";
import { useSelector } from "react-redux";
import { getChainId } from "@selectors/global.selectors";
import Container from "@components/container";
import Link from "next/link";
import ProductInfoCard from "@components/product-info-card";
import Filters from "@components/filters";
import { filterOrders, filterProducts } from "@utils/helpers";
import digitalaxApi from "@services/api/espa/api.service";
import { getEnabledNetworkByChainId } from "@services/network.service";
import config from "@utils/config";
import SecondaryInfoCard from "@components/secondary-info-card";
import ProductTiles from "@components/product-tiles";

const LandingPage = () => {
  const chainId = useSelector(getChainId);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [filter, setFilter] = useState("");
  const [sortBy, setSortBy] = useState(null);
  // const [marketplace, setMarketplace] = useState(0);

  useEffect(() => {
    import("react-facebook-pixel")
      .then((x) => x.default)
      .then((ReactPixel) => {
        ReactPixel.init("485692459240447");
        ReactPixel.pageView();

        Router.events.on("routeChangeComplete", () => {
          ReactPixel.pageView();
        });
      });
  }, []);

  const shuffle = (array) => {
    var currentIndex = array.length,
      randomIndex;

    // While there remain elements to shuffle...
    while (currentIndex != 0) {
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;

      // And swap it with the current element.
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex],
        array[currentIndex],
      ];
    }

    return array;
  };

  const getOwners = (garments, itemSold, users) => {
    if (!garments) return [];
    const owners = garments
      .slice(0, itemSold)
      .map((garment) => garment.owner.toLowerCase());
    const arranged = [...new Set(owners)];
    return arranged.map((garment) => {
      const user =
        users.find(
          (item) => item.wallet && item.wallet.toLowerCase() == garment
        ) || {};
      return {
        ...garment,
        ...user,
      };
    });
  };

  const fetchNfts = async () => {
    setLoading(true);
    const { digitalaxF3MCollectionGroups } = await getCollectionGroups(
      chainId,
      0
    );
    console.log({ digitalaxF3MCollectionGroups });
    const { digitalaxF3MMarketplaceOffers } =
      await getDigitalaxMarketplaceV3Offers(chainId, 0);
    const users = await digitalaxApi.getAllUsersName();
    const prods = [];

    digitalaxF3MCollectionGroups.forEach((collectionGroup) => {
      if (
        collectionGroup.collections.length > 1 ||
        (collectionGroup.collections.length === 1 &&
          collectionGroup.collections[0].id !== "0")
      ) {
        collectionGroup.collections.forEach((collection) => {
          const offer = digitalaxF3MMarketplaceOffers.find(
            (offer) => offer.id === collection.id
          );
          prods.push({
            id: collection.id,
            designer: collection.designer,
            rarity: collection.rarity,
            startTime: offer?.startTime,
            garment: collection.garments[0],
            owners: getOwners(
              offer?.garmentCollection.garments,
              offer?.amountSold,
              users
            ),
            primarySalePrice: offer ? offer.primarySalePrice : 0,
            sold: collection.garments.length === parseInt(offer?.amountSold),
            auction: false,
            version: 2,
          });
        });
      }
    });
    setProducts(shuffle(prods));
    setLoading(false);
  };

  useEffect(() => {
    fetchNfts();
  }, []);

  const fetchMore = () => {
    if (filteredNfts.length === products.length) {
      fetchNfts();
    }
  };

  const sortProducts = (filteredNfts) => {
    return filteredNfts.sort((a, b) => {
      if (a.sold && !b.sold) return 1;
      if (!a.sold && b.sold) return -1;
      return 0;
    });
  };

  const structuredData = {
    "@context": "http://schema.org",
    "@type": "Skins Landing page",
    title: "Digitalax - Web3 Fashion Economy",
    description:
      "Take your digital fashion skins to the next level: directly into indie games & mods, where players from amateur to pro can start to earn a livelihood through play, without sacrificing our love of the game. ESPA is the first casual esports platform, with direct integration with DIGITALAX NFT skins on Matic Network. ",
  };

  const filteredNfts = filterProducts(products, filter, sortBy) || [];

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
      <Head>
        <meta
          name="description"
          content="Take your digital fashion skins to the next level: directly into indie games & mods, where players from amateur to pro can start to earn a livelihood through play, without sacrificing our love of the game. ESPA is the first casual esports platform, with direct integration with DIGITALAX NFT skins on Matic Network. "
        />
        <meta property="og:title" content="Digitalax - Web3 Fashion Economy" />
        <meta
          property="og:description"
          content="Take your digital fashion skins to the next level: directly into indie games & mods, where players from amateur to pro can start to earn a livelihood through play, without sacrificing our love of the game. ESPA is the first casual esports platform, with direct integration with DIGITALAX NFT skins on Matic Network. "
        />
        <meta property="og:url" content="https://marketplace.digitalax.xyz" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:site" content="@ESPA4play" />
        <meta name="twitter:title" content="Skins Landing page" />
        <meta
          name="twitter:description"
          content="Take your digital fashion skins to the next level: directly into indie games & mods, where players from amateur to pro can start to earn a livelihood through play, without sacrificing our love of the game. ESPA is the first casual esports platform, with direct integration with DIGITALAX NFT skins on Matic Network. "
        />
        <script src="https://cdn.rawgit.com/progers/pathseg/master/pathseg.js"></script>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </Head>
      <section className={styles.homeHeroSection}>
        <img
          className={styles.headerImage}
          src="/images/header.jpg"
          alt="banner-header"
        />
        <div className={styles.overlay} />
        <div className={styles.leftWrapper}>
          <h1 className={styles.title}>
            F<sub>3</sub>Manifesto
          </h1>
        </div>

        <div className={styles.actionsWrapper}>
          <div className={styles.filtersWrapper}>
            <Filters
              // setType={(value) => {
              //   setMarketplace(parseInt(value));
              // }}
              filter={filter}
              filterChange={setFilter}
              sortByChange={setSortBy}
            />
          </div>
          <div className={styles.linkWrapper}>
            <Link href="/marketplace">
              <a
                className={styles.heroSectionLink}
              >{`SEE ALL COLLECTIONS >`}</a>
            </Link>
          </div>
        </div>
      </section>
      <ProductTiles products={filteredNfts} />
      <Container>
        <section className={styles.collectionsWrapper}>
          {sortProducts(filteredNfts).map((prod) => {
            // if (!prod.rarity) return <></>;
            if (prod.rarity) {
              return (
                <>
                  <ProductInfoCard
                    key={prod.id}
                    product={prod}
                    price={prod.auction ? prod.topBid : prod.primarySalePrice}
                    sold={prod.sold}
                    showRarity
                    showCollectionName
                    isAuction={prod.auction}
                  />
                </>
              );
            }
          })}
        </section>
      </Container>
    </div>
  );
};

export default LandingPage;
