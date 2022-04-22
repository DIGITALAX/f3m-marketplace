import CollectionCard from "@components/collection-card";
import Container from "@components/container";
import React from "react";
import styles from "./styles.module.scss";

const CollectionList = ({ items }) => {
  console.log('collections: ', items)
  return (
    <>
      <div className={styles.wrapper}>
        <Container>
          <section className={styles.collectionRowSection}>
            <div className={styles.body}>
              {items.map((item, index) => {
                return <CollectionCard collection={item} key={item.id} />;
              })}
            </div>
          </section>
        </Container>
      </div>
    </>
  );
};

export default CollectionList;
