// React & Next
import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { GetStaticProps } from "next";

// Libraries
import Prismic from "@prismicio/client";
import ptBR from "date-fns/locale/pt-BR";
import { format } from "date-fns";
import { FiCalendar, FiUser } from "react-icons/fi";

// Services
import { getPrismicClient } from "../services/prismic";

// Styles
import styles from "./home.module.scss";

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  const [posts, setPosts] = useState<Post[]>(postsPagination.results);
  const [nextPage, setNextPage] = useState<string>(postsPagination.next_page);

  async function handleNextPage() {
    const postsResult = await fetch(`${nextPage}`).then((response) =>
      response.json()
    );

    const newPostsFormatted = postsResult.results.map((post: Post) => {
      return {
        uid: post.uid,
        first_publication_date: format(
          new Date(post.first_publication_date ?? new Date()),
          "dd MMM yyyy",
          {
            locale: ptBR,
          }
        ),
        data: {
          title: post.data.title,
          subtitle: post.data.subtitle,
          author: post.data.author,
        },
      };
    });

    setNextPage(postsResult.next_page);
    setPosts([...posts, ...newPostsFormatted]);
  }

  return (
    <>
      <Head>
        <title>Home | spacetraveling</title>
      </Head>

      <main className={styles.container}>
        <div className={styles.posts}>
          {posts.map((post) => (
            <Link href={`/post/${post.uid}`} key={post.uid}>
              <a>
                <strong>{post.data.title}</strong>
                <p>{post.data.subtitle}</p>
                <div className={styles.postInfo}>
                  <div className={styles.postDate}>
                    <FiCalendar />
                    <time>{post.first_publication_date}</time>
                  </div>
                  <div className={styles.postAuthor}>
                    <FiUser />
                    <span>{post.data.author}</span>
                  </div>
                </div>
              </a>
            </Link>
          ))}
        </div>
        {nextPage && (
          <button
            type="button"
            className={styles.loadButton}
            onClick={handleNextPage}
          >
            Carregar mais posts
          </button>
        )}
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();

  const postsResponse = await prismic.query(
    [Prismic.predicates.at("document.type", "posts")],
    {
      fetch: [
        "posts.slug",
        "posts.first_publication_date",
        "posts.title",
        "posts.subtitle",
        "posts.author",
      ],
      pageSize: 3,
    }
  );

  const next_page = postsResponse.next_page;

  const posts = postsResponse.results.map((post) => {
    return {
      uid: post.uid,
      first_publication_date: format(
        new Date(post.first_publication_date ?? new Date()),
        "dd MMM yyyy",
        {
          locale: ptBR,
        }
      ),
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  return {
    props: { postsPagination: { results: posts, next_page: next_page } },
  };
  // TODO
};
