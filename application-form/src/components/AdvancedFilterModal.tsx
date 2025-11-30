import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { X, Filter, Search } from 'lucide-react';

interface AdvancedFilters {
  searchTerm: string;
  ageValue: number; // 年齢数値
  ageCondition: 'gte' | 'lte' | 'eq'; // 年齢条件
  gender: string;
  nationality: string; // 国籍を追加
  hasWorkExperience: boolean; // 職歴の有無
  japaneseLevel: 'all' | 'N1' | 'N2' | 'N3' | 'N4' | 'N5' | 'none'; // 日本語資格
  skillLevelFilters: { [skill: string]: 'all' | 'A' | 'B' | 'C' | 'D' }; // スキルごとのレベル
  // 資料作成データとの連携を強化
  hasSelfIntroduction: boolean;
  hasPhoto: boolean;
  hasWorkHistory: boolean;
  hasQualifications: boolean;
  spouseStatus: 'all' | 'married' | 'single' | 'other';
  commutingTime: 'all' | '30min' | '1hour' | '1.5hour' | '2hour' | '2hour+';
  interviewAttempts: number; // 面接受験回数
}

interface AdvancedFilterModalProps {
  onApplyFilters: (filters: AdvancedFilters) => void;
  onClearFilters: () => void;
  currentFilters: AdvancedFilters;
  availableSkills: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdvancedFilterModal({ 
  onApplyFilters, 
  onClearFilters, 
  currentFilters, 
  availableSkills,
  open,
  onOpenChange
}: AdvancedFilterModalProps) {
  const [filters, setFilters] = useState<AdvancedFilters>(currentFilters || {
    searchTerm: '',
    ageValue: 0,
    ageCondition: 'gte',
    gender: 'all',
    nationality: 'all',
    hasWorkExperience: false,
    japaneseLevel: 'all',
    skillLevelFilters: {},
    hasSelfIntroduction: false,
    hasPhoto: false,
    hasWorkHistory: false,
    hasQualifications: false,
    spouseStatus: 'all',
    commutingTime: 'all',
    interviewAttempts: 0,
  });
  const [skillSearchTerm, setSkillSearchTerm] = useState('');

  const handleApply = () => {
    onApplyFilters(filters);
    onOpenChange(false);
  };

  const handleClear = () => {
    const emptyFilters: AdvancedFilters = {
      searchTerm: '',
      ageValue: 0,
      ageCondition: 'gte',
      gender: 'all',
      nationality: 'all',
      hasWorkExperience: false,
      japaneseLevel: 'all',
      skillLevelFilters: {},
      hasSelfIntroduction: false,
      hasPhoto: false,
      hasWorkHistory: false,
      hasQualifications: false,
      spouseStatus: 'all',
      commutingTime: 'all',
      interviewAttempts: 0,
    };
    setFilters(emptyFilters);
    onClearFilters();
  };

  const filteredSkills = (availableSkills || []).filter(skill =>
    skill && skill.toLowerCase().includes(skillSearchTerm.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          詳細フィルター
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            詳細フィルター設定
          </DialogTitle>
          <DialogDescription>
            求職者を詳細に絞り込むためのフィルターを設定できます
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 基本情報フィルター */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">基本情報</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {/* 検索語 */}
              <div className="md:col-span-2">
                <Label>検索語</Label>
                <Input
                  placeholder="名前、メール、希望職種、住所で検索"
                  value={filters.searchTerm}
                  onChange={e => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                />
              </div>
              {/* 性別 */}
              <div>
                <Label>性別</Label>
                <Select value={filters.gender} onValueChange={v => setFilters(prev => ({ ...prev, gender: v }))}>
                  <SelectTrigger><SelectValue placeholder="指定なし" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">指定なし</SelectItem>
                    <SelectItem value="male">男性</SelectItem>
                    <SelectItem value="female">女性</SelectItem>
                    <SelectItem value="other">その他</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* 国籍 */}
              <div>
                <Label>国籍</Label>
                <Select value={filters.nationality} onValueChange={v => setFilters(prev => ({ ...prev, nationality: v }))}>
                  <SelectTrigger><SelectValue placeholder="指定なし" /></SelectTrigger>
                  <SelectContent className="max-h-60">
                    <SelectItem value="all">指定なし</SelectItem>
                    <SelectItem value="Japan">日本</SelectItem>
                    <SelectItem value="Afghanistan">アフガニスタン</SelectItem>
                    <SelectItem value="Albania">アルバニア</SelectItem>
                    <SelectItem value="Algeria">アルジェリア</SelectItem>
                    <SelectItem value="Andorra">アンドラ</SelectItem>
                    <SelectItem value="Angola">アンゴラ</SelectItem>
                    <SelectItem value="Antigua and Barbuda">アンティグア・バーブーダ</SelectItem>
                    <SelectItem value="Argentina">アルゼンチン</SelectItem>
                    <SelectItem value="Armenia">アルメニア</SelectItem>
                    <SelectItem value="Australia">オーストラリア</SelectItem>
                    <SelectItem value="Austria">オーストリア</SelectItem>
                    <SelectItem value="Azerbaijan">アゼルバイジャン</SelectItem>
                    <SelectItem value="Bahamas">バハマ</SelectItem>
                    <SelectItem value="Bahrain">バーレーン</SelectItem>
                    <SelectItem value="Bangladesh">バングラデシュ</SelectItem>
                    <SelectItem value="Barbados">バルバドス</SelectItem>
                    <SelectItem value="Belarus">ベラルーシ</SelectItem>
                    <SelectItem value="Belgium">ベルギー</SelectItem>
                    <SelectItem value="Belize">ベリーズ</SelectItem>
                    <SelectItem value="Benin">ベナン</SelectItem>
                    <SelectItem value="Bhutan">ブータン</SelectItem>
                    <SelectItem value="Bolivia">ボリビア</SelectItem>
                    <SelectItem value="Bosnia and Herzegovina">ボスニア・ヘルツェゴビナ</SelectItem>
                    <SelectItem value="Botswana">ボツワナ</SelectItem>
                    <SelectItem value="Brazil">ブラジル</SelectItem>
                    <SelectItem value="Brunei">ブルネイ</SelectItem>
                    <SelectItem value="Bulgaria">ブルガリア</SelectItem>
                    <SelectItem value="Burkina Faso">ブルキナファソ</SelectItem>
                    <SelectItem value="Burundi">ブルンジ</SelectItem>
                    <SelectItem value="Cambodia">カンボジア</SelectItem>
                    <SelectItem value="Cameroon">カメルーン</SelectItem>
                    <SelectItem value="Canada">カナダ</SelectItem>
                    <SelectItem value="Cape Verde">カーボベルデ</SelectItem>
                    <SelectItem value="Central African Republic">中央アフリカ共和国</SelectItem>
                    <SelectItem value="Chad">チャド</SelectItem>
                    <SelectItem value="Chile">チリ</SelectItem>
                    <SelectItem value="China">中国</SelectItem>
                    <SelectItem value="Colombia">コロンビア</SelectItem>
                    <SelectItem value="Comoros">コモロ</SelectItem>
                    <SelectItem value="Congo">コンゴ</SelectItem>
                    <SelectItem value="Democratic Republic of the Congo">コンゴ民主共和国</SelectItem>
                    <SelectItem value="Costa Rica">コスタリカ</SelectItem>
                    <SelectItem value="Cote d'Ivoire">コートジボワール</SelectItem>
                    <SelectItem value="Croatia">クロアチア</SelectItem>
                    <SelectItem value="Cuba">キューバ</SelectItem>
                    <SelectItem value="Cyprus">キプロス</SelectItem>
                    <SelectItem value="Czech Republic">チェコ共和国</SelectItem>
                    <SelectItem value="Denmark">デンマーク</SelectItem>
                    <SelectItem value="Djibouti">ジブチ</SelectItem>
                    <SelectItem value="Dominica">ドミニカ</SelectItem>
                    <SelectItem value="Dominican Republic">ドミニカ共和国</SelectItem>
                    <SelectItem value="Ecuador">エクアドル</SelectItem>
                    <SelectItem value="Egypt">エジプト</SelectItem>
                    <SelectItem value="El Salvador">エルサルバドル</SelectItem>
                    <SelectItem value="Equatorial Guinea">赤道ギニア</SelectItem>
                    <SelectItem value="Eritrea">エリトリア</SelectItem>
                    <SelectItem value="Estonia">エストニア</SelectItem>
                    <SelectItem value="Eswatini">エスワティニ</SelectItem>
                    <SelectItem value="Ethiopia">エチオピア</SelectItem>
                    <SelectItem value="Fiji">フィジー</SelectItem>
                    <SelectItem value="Finland">フィンランド</SelectItem>
                    <SelectItem value="France">フランス</SelectItem>
                    <SelectItem value="Gabon">ガボン</SelectItem>
                    <SelectItem value="Gambia">ガンビア</SelectItem>
                    <SelectItem value="Georgia">ジョージア</SelectItem>
                    <SelectItem value="Germany">ドイツ</SelectItem>
                    <SelectItem value="Ghana">ガーナ</SelectItem>
                    <SelectItem value="Greece">ギリシャ</SelectItem>
                    <SelectItem value="Grenada">グレナダ</SelectItem>
                    <SelectItem value="Guatemala">グアテマラ</SelectItem>
                    <SelectItem value="Guinea">ギニア</SelectItem>
                    <SelectItem value="Guinea-Bissau">ギニアビサウ</SelectItem>
                    <SelectItem value="Guyana">ガイアナ</SelectItem>
                    <SelectItem value="Haiti">ハイチ</SelectItem>
                    <SelectItem value="Honduras">ホンジュラス</SelectItem>
                    <SelectItem value="Hungary">ハンガリー</SelectItem>
                    <SelectItem value="Iceland">アイスランド</SelectItem>
                    <SelectItem value="India">インド</SelectItem>
                    <SelectItem value="Indonesia">インドネシア</SelectItem>
                    <SelectItem value="Iran">イラン</SelectItem>
                    <SelectItem value="Iraq">イラク</SelectItem>
                    <SelectItem value="Ireland">アイルランド</SelectItem>
                    <SelectItem value="Israel">イスラエル</SelectItem>
                    <SelectItem value="Italy">イタリア</SelectItem>
                    <SelectItem value="Jamaica">ジャマイカ</SelectItem>
                    <SelectItem value="Jordan">ヨルダン</SelectItem>
                    <SelectItem value="Kazakhstan">カザフスタン</SelectItem>
                    <SelectItem value="Kenya">ケニア</SelectItem>
                    <SelectItem value="Kiribati">キリバス</SelectItem>
                    <SelectItem value="North Korea">北朝鮮</SelectItem>
                    <SelectItem value="Korea">韓国</SelectItem>
                    <SelectItem value="Kuwait">クウェート</SelectItem>
                    <SelectItem value="Kyrgyzstan">キルギス</SelectItem>
                    <SelectItem value="Laos">ラオス</SelectItem>
                    <SelectItem value="Latvia">ラトビア</SelectItem>
                    <SelectItem value="Lebanon">レバノン</SelectItem>
                    <SelectItem value="Lesotho">レソト</SelectItem>
                    <SelectItem value="Liberia">リベリア</SelectItem>
                    <SelectItem value="Libya">リビア</SelectItem>
                    <SelectItem value="Liechtenstein">リヒテンシュタイン</SelectItem>
                    <SelectItem value="Lithuania">リトアニア</SelectItem>
                    <SelectItem value="Luxembourg">ルクセンブルク</SelectItem>
                    <SelectItem value="Madagascar">マダガスカル</SelectItem>
                    <SelectItem value="Malawi">マラウィ</SelectItem>
                    <SelectItem value="Malaysia">マレーシア</SelectItem>
                    <SelectItem value="Maldives">モルディブ</SelectItem>
                    <SelectItem value="Mali">マリ</SelectItem>
                    <SelectItem value="Malta">マルタ</SelectItem>
                    <SelectItem value="Marshall Islands">マーシャル諸島</SelectItem>
                    <SelectItem value="Mauritania">モーリタニア</SelectItem>
                    <SelectItem value="Mauritius">モーリシャス</SelectItem>
                    <SelectItem value="Mexico">メキシコ</SelectItem>
                    <SelectItem value="Micronesia">ミクロネシア</SelectItem>
                    <SelectItem value="Moldova">モルドバ</SelectItem>
                    <SelectItem value="Monaco">モナコ</SelectItem>
                    <SelectItem value="Mongolia">モンゴル</SelectItem>
                    <SelectItem value="Montenegro">モンテネグロ</SelectItem>
                    <SelectItem value="Morocco">モロッコ</SelectItem>
                    <SelectItem value="Mozambique">モザンビーク</SelectItem>
                    <SelectItem value="Myanmar">ミャンマー</SelectItem>
                    <SelectItem value="Namibia">ナミビア</SelectItem>
                    <SelectItem value="Nauru">ナウル</SelectItem>
                    <SelectItem value="Nepal">ネパール</SelectItem>
                    <SelectItem value="Netherlands">オランダ</SelectItem>
                    <SelectItem value="New Zealand">ニュージーランド</SelectItem>
                    <SelectItem value="Nicaragua">ニカラグア</SelectItem>
                    <SelectItem value="Niger">ニジェール</SelectItem>
                    <SelectItem value="Nigeria">ナイジェリア</SelectItem>
                    <SelectItem value="North Macedonia">北マケドニア</SelectItem>
                    <SelectItem value="Norway">ノルウェー</SelectItem>
                    <SelectItem value="Oman">オマーン</SelectItem>
                    <SelectItem value="Pakistan">パキスタン</SelectItem>
                    <SelectItem value="Palau">パラオ</SelectItem>
                    <SelectItem value="Panama">パナマ</SelectItem>
                    <SelectItem value="Papua New Guinea">パプアニューギニア</SelectItem>
                    <SelectItem value="Paraguay">パラグアイ</SelectItem>
                    <SelectItem value="Peru">ペルー</SelectItem>
                    <SelectItem value="Philippines">フィリピン</SelectItem>
                    <SelectItem value="Poland">ポーランド</SelectItem>
                    <SelectItem value="Portugal">ポルトガル</SelectItem>
                    <SelectItem value="Qatar">カタール</SelectItem>
                    <SelectItem value="Romania">ルーマニア</SelectItem>
                    <SelectItem value="Russia">ロシア</SelectItem>
                    <SelectItem value="Rwanda">ルワンダ</SelectItem>
                    <SelectItem value="Saint Kitts and Nevis">セントクリストファー・ネイビス</SelectItem>
                    <SelectItem value="Saint Lucia">セントルシア</SelectItem>
                    <SelectItem value="Saint Vincent and the Grenadines">セントビンセント・グレナディーン</SelectItem>
                    <SelectItem value="Samoa">サモア</SelectItem>
                    <SelectItem value="San Marino">サンマリノ</SelectItem>
                    <SelectItem value="Sao Tome and Principe">サントメ・プリンシペ</SelectItem>
                    <SelectItem value="Saudi Arabia">サウジアラビア</SelectItem>
                    <SelectItem value="Senegal">セネガル</SelectItem>
                    <SelectItem value="Serbia">セルビア</SelectItem>
                    <SelectItem value="Seychelles">セーシェル</SelectItem>
                    <SelectItem value="Sierra Leone">シエラレオネ</SelectItem>
                    <SelectItem value="Singapore">シンガポール</SelectItem>
                    <SelectItem value="Slovakia">スロバキア</SelectItem>
                    <SelectItem value="Slovenia">スロベニア</SelectItem>
                    <SelectItem value="Solomon Islands">ソロモン諸島</SelectItem>
                    <SelectItem value="Somalia">ソマリア</SelectItem>
                    <SelectItem value="South Africa">南アフリカ</SelectItem>
                    <SelectItem value="South Sudan">南スーダン</SelectItem>
                    <SelectItem value="Spain">スペイン</SelectItem>
                    <SelectItem value="Sri Lanka">スリランカ</SelectItem>
                    <SelectItem value="Sudan">スーダン</SelectItem>
                    <SelectItem value="Suriname">スリナム</SelectItem>
                    <SelectItem value="Sweden">スウェーデン</SelectItem>
                    <SelectItem value="Switzerland">スイス</SelectItem>
                    <SelectItem value="Syria">シリア</SelectItem>
                    <SelectItem value="Tajikistan">タジキスタン</SelectItem>
                    <SelectItem value="Tanzania">タンザニア</SelectItem>
                    <SelectItem value="Thailand">タイ</SelectItem>
                    <SelectItem value="Timor-Leste">東ティモール</SelectItem>
                    <SelectItem value="Togo">トーゴ</SelectItem>
                    <SelectItem value="Tonga">トンガ</SelectItem>
                    <SelectItem value="Trinidad and Tobago">トリニダード・トバゴ</SelectItem>
                    <SelectItem value="Tunisia">チュニジア</SelectItem>
                    <SelectItem value="Turkey">トルコ</SelectItem>
                    <SelectItem value="Turkmenistan">トルクメニスタン</SelectItem>
                    <SelectItem value="Tuvalu">ツバル</SelectItem>
                    <SelectItem value="Uganda">ウガンダ</SelectItem>
                    <SelectItem value="Ukraine">ウクライナ</SelectItem>
                    <SelectItem value="United Arab Emirates">アラブ首長国連邦</SelectItem>
                    <SelectItem value="United Kingdom">イギリス</SelectItem>
                    <SelectItem value="United States">アメリカ合衆国</SelectItem>
                    <SelectItem value="Uruguay">ウルグアイ</SelectItem>
                    <SelectItem value="Uzbekistan">ウズベキスタン</SelectItem>
                    <SelectItem value="Vanuatu">バヌアツ</SelectItem>
                    <SelectItem value="Vatican City">バチカン市国</SelectItem>
                    <SelectItem value="Venezuela">ベネズエラ</SelectItem>
                    <SelectItem value="Vietnam">ベトナム</SelectItem>
                    <SelectItem value="Yemen">イエメン</SelectItem>
                    <SelectItem value="Zambia">ザンビア</SelectItem>
                    <SelectItem value="Zimbabwe">ジンバブエ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* 年齢 */}
              <div>
                <Label>年齢</Label>
                <div className="flex gap-2 items-center">
                  <Select value={filters.ageCondition} onValueChange={v => setFilters(prev => ({ ...prev, ageCondition: v as any }))}>
                    <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gte">以上</SelectItem>
                      <SelectItem value="lte">以下</SelectItem>
                      <SelectItem value="eq">イコール</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input type="number" min={0} value={filters.ageValue} onChange={e => setFilters(prev => ({ ...prev, ageValue: Number(e.target.value) }))} className="w-20" />
                  <span>歳</span>
                </div>
              </div>
            </div>
          </div>

          {/* 職歴・日本語資格フィルター */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">職歴・日本語資格</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {/* 職歴の有無 */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasWorkExperience"
                  checked={filters.hasWorkExperience}
                  onCheckedChange={(checked) => setFilters(prev => ({ ...prev, hasWorkExperience: checked as boolean }))}
                />
                <Label htmlFor="hasWorkExperience">職歴あり</Label>
              </div>
              {/* 日本語資格 */}
              <div>
                <Label>日本語資格</Label>
                <Select value={filters.japaneseLevel} onValueChange={v => setFilters(prev => ({ ...prev, japaneseLevel: v as any }))}>
                  <SelectTrigger><SelectValue placeholder="指定なし" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">指定なし</SelectItem>
                    <SelectItem value="N1">N1</SelectItem>
                    <SelectItem value="N2">N2</SelectItem>
                    <SelectItem value="N3">N3</SelectItem>
                    <SelectItem value="N4">N4</SelectItem>
                    <SelectItem value="N5">N5</SelectItem>
                    <SelectItem value="none">無</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* 資料作成データ連携フィルター */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">資料作成データ</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {/* 自己紹介 */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasSelfIntroduction"
                  checked={filters.hasSelfIntroduction}
                  onCheckedChange={(checked) => setFilters(prev => ({ ...prev, hasSelfIntroduction: checked as boolean }))}
                />
                <Label htmlFor="hasSelfIntroduction">自己紹介あり</Label>
              </div>
              {/* 写真 */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasPhoto"
                  checked={filters.hasPhoto}
                  onCheckedChange={(checked) => setFilters(prev => ({ ...prev, hasPhoto: checked as boolean }))}
                />
                <Label htmlFor="hasPhoto">写真あり</Label>
              </div>
              {/* 職歴 */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasWorkHistory"
                  checked={filters.hasWorkHistory}
                  onCheckedChange={(checked) => setFilters(prev => ({ ...prev, hasWorkHistory: checked as boolean }))}
                />
                <Label htmlFor="hasWorkHistory">職歴あり</Label>
              </div>
              {/* 資格 */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasQualifications"
                  checked={filters.hasQualifications}
                  onCheckedChange={(checked) => setFilters(prev => ({ ...prev, hasQualifications: checked as boolean }))}
                />
                <Label htmlFor="hasQualifications">資格あり</Label>
              </div>
              {/* 配偶者状況 */}
              <div>
                <Label>配偶者状況</Label>
                <Select value={filters.spouseStatus} onValueChange={v => setFilters(prev => ({ ...prev, spouseStatus: v as any }))}>
                  <SelectTrigger><SelectValue placeholder="指定なし" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">指定なし</SelectItem>
                    <SelectItem value="married">配偶者あり</SelectItem>
                    <SelectItem value="single">配偶者なし</SelectItem>
                    <SelectItem value="other">その他</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* 通勤時間 */}
              <div>
                <Label>通勤時間</Label>
                <Select value={filters.commutingTime} onValueChange={v => setFilters(prev => ({ ...prev, commutingTime: v as any }))}>
                  <SelectTrigger><SelectValue placeholder="指定なし" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">指定なし</SelectItem>
                    <SelectItem value="30min">30分以内</SelectItem>
                    <SelectItem value="1hour">1時間以内</SelectItem>
                    <SelectItem value="1.5hour">1.5時間以内</SelectItem>
                    <SelectItem value="2hour">2時間以内</SelectItem>
                    <SelectItem value="2hour+">2時間以上</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* 面接受験回数フィルター */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">面接受験回数条件</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>面接受験回数（以上）</Label>
                <Input
                  type="number"
                  min="0"
                  value={filters.interviewAttempts}
                  onChange={e => setFilters(prev => ({
                    ...prev,
                    interviewAttempts: parseInt(e.target.value) || 0
                  }))}
                  placeholder="0"
                  className="max-w-md"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  指定した回数以上面接を受験した求職者を表示します
                </p>
              </div>
            </div>
          </div>

          {/* スキルレベルフィルタ */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">スキルレベル条件</h3>
            <p className="text-sm text-muted-foreground">
              各スキルについて、選択したレベル以上の求職者を表示します（A {'>'} B {'>'} C {'>'} D）
            </p>
            
            {/* スキル検索 */}
            <div className="mb-4">
              <Label>スキル検索</Label>
              <Input
                placeholder="スキル名で検索..."
                value={skillSearchTerm}
                onChange={e => setSkillSearchTerm(e.target.value)}
                className="max-w-md"
              />
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto border rounded-md p-4">
              {filteredSkills.map(skill => (
                <div key={skill} className="flex items-center gap-2">
                  <Label className="w-32 truncate text-sm">{skill}</Label>
                  <Select
                    value={filters.skillLevelFilters[skill] || 'all'}
                    onValueChange={v => setFilters(prev => ({
                      ...prev,
                      skillLevelFilters: { ...prev.skillLevelFilters, [skill]: v as any }
                    }))}
                  >
                    <SelectTrigger className="w-20 h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">指定なし</SelectItem>
                      <SelectItem value="A">A以上</SelectItem>
                      <SelectItem value="B">B以上</SelectItem>
                      <SelectItem value="C">C以上</SelectItem>
                      <SelectItem value="D">D以上</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
            
            {/* 設定済みスキルフィルター表示 */}
            {Object.keys(filters.skillLevelFilters).filter(skill => 
              filters.skillLevelFilters[skill] !== 'all'
            ).length > 0 && (
              <div className="mt-4">
                <Label className="text-sm font-medium">設定済みスキルフィルター:</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {Object.entries(filters.skillLevelFilters)
                    .filter(([_, level]) => level !== 'all')
                    .map(([skill, level]) => (
                      <Badge key={skill} variant="secondary" className="text-xs">
                        {skill}: {level}以上
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 ml-1"
                          onClick={() => setFilters(prev => ({
                            ...prev,
                            skillLevelFilters: { ...prev.skillLevelFilters, [skill]: 'all' }
                          }))}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between pt-6 border-t">
          <Button variant="outline" onClick={handleClear}>
            フィルタークリア
          </Button>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              キャンセル
            </Button>
            <Button onClick={handleApply}>
              <Search className="h-4 w-4 mr-2" />
              フィルター適用
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 