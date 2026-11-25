import postgres from "postgres";

declare global {
  // eslint-disable-next-line no-var
  var __sql: postgres.Sql | undefined;
}

function criar() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL não definida");
  return postgres(url, {
    max: 5,
    onnotice: () => {},
    // Datas (tipo date) chegam como texto AAAA-MM-DD, sem fuso.
    types: {
      date: {
        to: 1082,
        from: [1082],
        serialize: (x: string) => x,
        parse: (x: string) => x,
      },
    },
  });
}

export function db(): postgres.Sql {
  if (!globalThis.__sql) globalThis.__sql = criar();
  return globalThis.__sql;
}
