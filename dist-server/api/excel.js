// 多言語対応Excelファイル生成API
export const generateMultilingualExcel = async (request) => {
    try {
        // Excelファイル生成のリクエストをサーバーに送信
        const response = await fetch('/api/generate-excel', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId: request.userId,
                language: request.language,
                includeResume: request.includeResume ?? true,
                includeSkillSheet: request.includeSkillSheet ?? true,
            }),
        });
        if (!response.ok) {
            throw new Error('Excelファイル生成に失敗しました');
        }
        const result = await response.json();
        const typedResult = result;
        if (typeof typedResult.success === 'undefined') {
            return { ...typedResult, success: false };
        }
        return typedResult;
    }
    catch (error) {
        console.error('Excel生成エラー:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : '不明なエラーが発生しました',
        };
    }
};
// ExcelファイルダウンロードAPI
export const downloadExcelFile = async (filePath) => {
    try {
        const response = await fetch(`/api/download-excel?file=${encodeURIComponent(filePath)}`);
        if (!response.ok) {
            throw new Error('ファイルのダウンロードに失敗しました');
        }
        return await response.blob();
    }
    catch (error) {
        console.error('ダウンロードエラー:', error);
        throw error;
    }
};
// 多言語表示用のヘルパー関数
export const getMultilingualText = (key, language = 'ja') => {
    const translations = {
        ja: {
            'basicInformation': '基本情報',
            'personalInformation': '個人情報',
            'contactInformation': '連絡先情報',
            'fullName': '氏名',
            'dateOfBirth': '生年月日',
            'gender': '性別',
            'email': 'メールアドレス',
            'phone': '電話番号',
            'address': '住所',
            'desiredJobTitle': '希望職種',
            'experience': '経験年数',
            'education': '学歴',
            'workHistory': '職歴',
            'skills': 'スキル',
            'qualifications': '資格',
            'preferences': '希望条件',
            'selfIntroduction': '自己紹介',
            'resume': '履歴書',
            'workExperience': '職務経歴書',
            'skillSheet': 'スキルシート',
        },
        en: {
            'basicInformation': 'Basic Information',
            'personalInformation': 'Personal Information',
            'contactInformation': 'Contact Information',
            'fullName': 'Full Name',
            'dateOfBirth': 'Date of Birth',
            'gender': 'Gender',
            'email': 'Email',
            'phone': 'Phone',
            'address': 'Address',
            'desiredJobTitle': 'Desired Job Title',
            'experience': 'Years of Experience',
            'education': 'Education',
            'workHistory': 'Work History',
            'skills': 'Skills',
            'qualifications': 'Qualifications',
            'preferences': 'Preferences',
            'selfIntroduction': 'Self Introduction',
            'resume': 'Resume',
            'workExperience': 'Work Experience',
            'skillSheet': 'Skill Sheet',
        }
    };
    const jaText = translations.ja[key] || key;
    const enText = translations.en[key] || key;
    if (language === 'ja') {
        return `${jaText}/${enText}`;
    }
    else {
        return `${enText}/${jaText}`;
    }
};
