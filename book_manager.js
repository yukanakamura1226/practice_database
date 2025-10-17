#!/usr/bin/env node
/**
 * 簡単なデータベース体験プログラム - 本の管理システム
 * SQLiteを使用してデータベースの基本操作（CRUD）を学習できます
 */

import Database from 'better-sqlite3';
import * as readline from 'readline';

class BookManager {
  constructor(dbName = 'books.db') {
    this.dbName = dbName;
    this.db = null;
  }

  connect() {
    this.db = new Database(this.dbName);
    console.log(`✓ データベース '${this.dbName}' に接続しました`);
  }

  createTable() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS books (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        author TEXT NOT NULL,
        year INTEGER,
        created_at TEXT
      )
    `);
    console.log("✓ テーブル 'books' を作成しました");
  }

  addBook(title, author, year = null) {
    const createdAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const stmt = this.db.prepare(`
      INSERT INTO books (title, author, year, created_at)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(title, author, year, createdAt);
    console.log(`✓ 本を追加しました: 『${title}』 著者: ${author}`);
  }

  showAllBooks() {
    const stmt = this.db.prepare('SELECT * FROM books ORDER BY id');
    const books = stmt.all();

    if (books.length === 0) {
      console.log("📚 データベースに本が登録されていません");
      return;
    }

    console.log("\n" + "=".repeat(70));
    console.log("📚 登録されている本の一覧");
    console.log("=".repeat(70));

    for (const book of books) {
      const yearStr = book.year ? `(${book.year}年)` : "";
      console.log(`ID: ${book.id} | 『${book.title}』 ${yearStr}`);
      console.log(`       著者: ${book.author} | 登録日時: ${book.created_at}`);
      console.log("-".repeat(70));
    }
    console.log();
  }

  findBook(bookId) {
    const stmt = this.db.prepare('SELECT * FROM books WHERE id = ?');
    const book = stmt.get(bookId);

    if (book) {
      console.log(`\n📖 本が見つかりました:`);
      console.log(`   ID: ${book.id}`);
      console.log(`   タイトル: 『${book.title}』`);
      console.log(`   著者: ${book.author}`);
      if (book.year) {
        console.log(`   出版年: ${book.year}年`);
      }
      console.log(`   登録日時: ${book.created_at}\n`);
      return book;
    } else {
      console.log(`⚠ ID ${bookId} の本は見つかりませんでした`);
      return null;
    }
  }

  updateBook(bookId, title = null, author = null, year = null) {
    const book = this.findBook(bookId);
    if (!book) {
      return;
    }

    const newTitle = title || book.title;
    const newAuthor = author || book.author;
    const newYear = year !== null ? year : book.year;

    const stmt = this.db.prepare(`
      UPDATE books
      SET title = ?, author = ?, year = ?
      WHERE id = ?
    `);
    stmt.run(newTitle, newAuthor, newYear, bookId);
    console.log(`✓ ID ${bookId} の本を更新しました`);
  }

  deleteBook(bookId) {
    const book = this.findBook(bookId);
    if (!book) {
      return;
    }

    const stmt = this.db.prepare('DELETE FROM books WHERE id = ?');
    stmt.run(bookId);
    console.log(`✓ ID ${bookId} の本を削除しました`);
  }

  countBooks() {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM books');
    const result = stmt.get();
    console.log(`📊 登録されている本の総数: ${result.count}冊`);
    return result.count;
  }

  close() {
    if (this.db) {
      this.db.close();
      console.log("✓ データベース接続を閉じました");
    }
  }
}

function demo() {
  console.log("\n" + "=".repeat(70));
  console.log("📚 データベース体験プログラム - 本の管理システム");
  console.log("=".repeat(70) + "\n");

  // データベース接続
  const manager = new BookManager();
  manager.connect();
  manager.createTable();
  console.log();

  // CREATE: 本を追加
  console.log("【1. CREATE操作 - データの追加】");
  manager.addBook("吾輩は猫である", "夏目漱石", 1905);
  manager.addBook("人間失格", "太宰治", 1948);
  manager.addBook("雪国", "川端康成", 1935);
  console.log();

  // READ: すべての本を表示
  console.log("【2. READ操作 - データの読み取り（全件）】");
  manager.showAllBooks();

  // READ: 特定の本を検索
  console.log("【3. READ操作 - データの読み取り（検索）】");
  manager.findBook(2);

  // UPDATE: 本の情報を更新
  console.log("【4. UPDATE操作 - データの更新】");
  manager.updateBook(2, "人間失格（改訂版）");
  manager.showAllBooks();

  // DELETE: 本を削除
  console.log("【5. DELETE操作 - データの削除】");
  manager.deleteBook(3);
  manager.showAllBooks();

  // 統計情報
  console.log("【6. 統計情報】");
  manager.countBooks();
  console.log();

  // 接続を閉じる
  manager.close();
  console.log("\n" + "=".repeat(70));
  console.log("✅ デモンストレーション完了！");
  console.log("=".repeat(70) + "\n");
}

async function interactiveMode() {
  const manager = new BookManager();
  manager.connect();
  manager.createTable();

  console.log("\n📚 本の管理システム - 対話モード");
  console.log("コマンド一覧:");
  console.log("  1: 本を追加");
  console.log("  2: 全ての本を表示");
  console.log("  3: 本を検索");
  console.log("  4: 本を更新");
  console.log("  5: 本を削除");
  console.log("  6: 統計情報を表示");
  console.log("  q: 終了\n");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (prompt) => {
    return new Promise((resolve) => {
      rl.question(prompt, resolve);
    });
  };

  while (true) {
    const command = (await question("コマンドを入力 > ")).trim();
    console.log();

    if (command === 'q') {
      break;
    } else if (command === '1') {
      const title = await question("タイトル: ");
      const author = await question("著者: ");
      const yearStr = await question("出版年（省略可）: ");
      const year = yearStr ? parseInt(yearStr) : null;
      manager.addBook(title, author, year);
    } else if (command === '2') {
      manager.showAllBooks();
    } else if (command === '3') {
      const bookId = parseInt(await question("検索するID: "));
      manager.findBook(bookId);
    } else if (command === '4') {
      const bookId = parseInt(await question("更新するID: "));
      console.log("（変更しない項目は空白のままEnterを押してください）");
      const title = (await question("新しいタイトル: ")).trim() || null;
      const author = (await question("新しい著者: ")).trim() || null;
      const yearStr = (await question("新しい出版年: ")).trim();
      const year = yearStr ? parseInt(yearStr) : null;
      manager.updateBook(bookId, title, author, year);
    } else if (command === '5') {
      const bookId = parseInt(await question("削除するID: "));
      manager.deleteBook(bookId);
    } else if (command === '6') {
      manager.countBooks();
    } else {
      console.log("無効なコマンドです");
    }
    console.log();
  }

  rl.close();
  manager.close();
  console.log("👋 お疲れ様でした！\n");
}

// メイン処理
const args = process.argv.slice(2);

if (args.includes('-i')) {
  // 対話モード
  interactiveMode();
} else {
  // デモモード
  demo();
}
