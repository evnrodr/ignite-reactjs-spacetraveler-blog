import { GetServerSideProps, GetStaticPaths, GetStaticProps } from "next";
import { RichText } from "prismic-dom";
import { useEffect } from "react";
import Prismic from "@prismicio/client";
import Head from "next/head";
import { FiCalendar, FiUser, FiClock } from "react-icons/fi";

import { getPrismicClient } from "../../services/prismic";

import commonStyles from "../../styles/common.module.scss";
import styles from "./post.module.scss";
import format from "date-fns/format";
import ptBR from "date-fns/locale/pt-BR";
import { useRouter } from "next/router";

interface PostProps {
  heading: string;
  body: {
    text: string;
  }[];
}

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const router = useRouter();
  const { title, author, banner, content } = post.data;

  const wordCounter = content.reduce((total, contentItem) => {
    total += contentItem.heading.split(" ").length;

    contentItem.body.map((paragraph) => {
      total += paragraph.text.split(" ").length;
    });

    return total;
  }, 0);

  const readTime = Math.ceil(wordCounter / 200);

  useEffect(() => {
    let script = document.createElement("script");
    let anchor = document.getElementById("inject-comments-for-uterances");
    script.setAttribute("src", "https://utteranc.es/client.js");
    script.setAttribute("crossorigin", "anonymous");
    script.setAttribute("async", "true");
    script.setAttribute("repo", "evnrodr/ignite-reactjs-spacetraveler-blog");
    script.setAttribute("issue-term", "pathname");
    script.setAttribute("theme", "github-dark");
    anchor.appendChild(script);
  }, []);

  if (router.isFallback) {
    return <h1>Carregando...</h1>;
  }

  return (
    <>
      <Head>
        <title>{title} | spacetraveling</title>
      </Head>

      <header className={styles.header}>
        <img src={banner.url} alt="Post banner" />
      </header>

      <main className={styles.postContainer}>
        <h1>{title}</h1>

        <div className={styles.postInfo}>
          <div className={styles.postDate}>
            <FiCalendar />
            <time>{post.first_publication_date}</time>
          </div>
          <div className={styles.postAuthor}>
            <FiUser />
            <span>{author}</span>
          </div>
          <div className={styles.postAuthor}>
            <FiClock />
            <span>{readTime} min</span>
          </div>
        </div>

        {content.map((content) => (
          <article className={styles.content} key={content.heading}>
            <h2>{content.heading}</h2>
            <div
              dangerouslySetInnerHTML={{
                __html: RichText.asHtml(content.body),
              }}
            />
          </article>
        ))}
        <div id="inject-comments-for-uterances" />
      </main>
    </>
  );
}

// export const getStaticPaths: GetStaticPaths = async () => {
//   const prismic = getPrismicClient();
//   const posts = await prismic.query(
//     Prismic.predicates.at("document.type", "posts"),
//     {}
//   );

//   const paths = posts.results.map((post) => {
//     return {
//       params: {
//         slug: post.uid,
//       },
//     };
//   });

//   return {
//     paths,
//     fallback: true,
//   };
// };

export const getServerSideProps: GetServerSideProps = async ({
  req,
  params,
}) => {
  const { slug } = params;

  const prismic = getPrismicClient(req);
  const response = await prismic.getByUID("posts", String(slug), {});

  const post = {
    first_publication_date: format(
      new Date(response.first_publication_date ?? new Date()),
      "dd MMM yyyy",
      {
        locale: ptBR,
      }
    ),
    uid: response.uid,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      author: response.data.author,
      banner: {
        url: response.data.banner.url,
      },
      content: response.data.content.map((content: PostProps) => {
        return {
          body: [...content.body],
          heading: content.heading,
        };
      }),
    },
  };

  return {
    props: { post },
  };
};
