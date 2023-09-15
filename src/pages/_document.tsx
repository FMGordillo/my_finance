import Document, { Html, Head, Main, NextScript } from "next/document";
import type { DocumentProps } from "next/document";

type Props = DocumentProps & {
  // add custom document props
};

class MyDocument extends Document<Props> {
  render() {
    const currentLocale =
      this.props.__NEXT_DATA__.locale ?? 'es';

    return (
      <Html lang={currentLocale}>
        <Head>
          <meta charSet="utf-8" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
