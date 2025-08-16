import { Request, Response } from 'express';
import { query } from '../../integrations/postgres/client.js';

export async function generateSitemap(req: Request, res: Response) {
  try {
    // ブログ記事を取得
    const blogPostsQuery = `
      SELECT slug_ja, updated_at 
      FROM blog_posts 
      WHERE status = 'published' 
      ORDER BY published_at DESC
    `;
    const blogPosts = await query(blogPostsQuery);

    // サイトマップXMLを生成
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- メインページ -->
  <url>
    <loc>https://justjoin.jp</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  
  <!-- 求職者ページ -->
  <url>
    <loc>https://justjoin.jp/jobseeker</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  
  <!-- 企業ページ -->
  <url>
    <loc>https://justjoin.jp/employer</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  
  <!-- ブログ一覧 -->
  <url>
    <loc>https://justjoin.jp/blog</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>
  
  <!-- 求職者向けブログ -->
  <url>
    <loc>https://justjoin.jp/blog?category=jobseeker</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
  
  <!-- 企業向けブログ -->
  <url>
    <loc>https://justjoin.jp/blog?category=company</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
  
  <!-- 法的事項ページ -->
  <url>
    <loc>https://justjoin.jp/privacy-policy</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>
  
  <url>
    <loc>https://justjoin.jp/terms-of-service</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>
  
  <!-- ブログ記事 -->
  ${blogPosts.rows.map(post => `
  <url>
    <loc>https://justjoin.jp/blog/${post.slug_ja}</loc>
    <lastmod>${new Date(post.updated_at).toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  `).join('')}
</urlset>`;

    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // 1時間キャッシュ
    res.status(200).send(sitemap);
  } catch (error) {
    console.error('サイトマップ生成エラー:', error);
    res.status(500).json({ error: 'サイトマップの生成に失敗しました' });
  }
} 