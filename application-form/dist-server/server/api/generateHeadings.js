export async function generateHeadings(req, res) {
    try {
        const { content } = req.body;
        if (!content) {
            return res.status(400).json({
                success: false,
                error: 'コンテンツが提供されていません'
            });
        }
        // コンテンツを段落に分割
        const paragraphs = content
            .split('\n\n')
            .map(p => p.trim())
            .filter(p => p.length > 50); // 50文字以上の段落のみ
        if (paragraphs.length === 0) {
            return res.status(400).json({
                success: false,
                error: '見出しを生成するコンテンツがありません'
            });
        }
        // 各段落から見出し候補を生成
        const headings = [];
        for (let i = 0; i < Math.min(paragraphs.length, 5); i++) { // 最大5個の見出し
            const paragraph = paragraphs[i];
            // 段落の最初の文を抽出
            const firstSentence = paragraph.split('。')[0];
            if (firstSentence.length > 10) {
                // 見出しとして適切な長さの場合はそのまま使用
                headings.push(firstSentence);
            }
            else {
                // 短すぎる場合は段落の最初の30文字を使用
                const heading = paragraph.substring(0, 30).trim();
                if (heading.length > 5) {
                    headings.push(heading + '...');
                }
            }
        }
        // 重複を除去
        const uniqueHeadings = [...new Set(headings)];
        return res.json({
            success: true,
            headings: uniqueHeadings
        });
    }
    catch (error) {
        console.error('見出し生成エラー:', error);
        return res.status(500).json({
            success: false,
            error: '見出しの生成に失敗しました'
        });
    }
}
