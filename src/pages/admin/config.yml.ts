import type { APIRoute } from 'astro';
import { SITE, BASE, GITHUB_OWNER, GITHUB_REPO } from '../../../site.config.mjs';

/**
 * Sveltia CMS configuration (Decap-compatible), generated so the site URL and
 * base path always match site.config.mjs. Labels are Korean-first.
 */
const siteUrl = SITE + BASE;
const media = { media_folder: 'src/assets/media', public_folder: '/src/assets/media' };
const imageHint = 'JPG·PNG·WEBP. 사진은 자동으로 웹용(WebP, 긴 변 4096px)으로 변환됩니다.';

const config = {
  backend: {
    name: 'github',
    repo: `${GITHUB_OWNER}/${GITHUB_REPO}`,
    branch: 'main',
    commit_messages: {
      create: '작품 추가: {{slug}}',
      update: '수정: {{slug}}',
      delete: '삭제: {{slug}}',
      uploadMedia: '이미지 업로드: {{path}}',
      deleteMedia: '이미지 삭제: {{path}}',
    },
  },
  app_title: 'goll show — 관리자',
  site_url: siteUrl,
  display_url: siteUrl,
  logo_url: `${siteUrl}apple-touch-icon.png`,
  ...media,
  media_libraries: {
    default: {
      config: {
        max_file_size: 52428800,
        transformations: {
          raster_image: { format: 'webp', quality: 90, width: 4096, height: 4096 },
        },
      },
    },
  },
  slug: { encoding: 'unicode', clean_accents: false, sanitize_replacement: '-' },
  collections: [
    {
      name: 'works',
      label: '작품',
      label_singular: '작품',
      description: '그림·드로잉·디지털·음악·영화 작품. "분류"에 따라 해당 전시실에 걸립니다.',
      folder: 'src/content/works',
      create: true,
      extension: 'md',
      format: 'frontmatter',
      slug: '{{title}}',
      identifier_field: 'title',
      summary: '{{category}} · {{year}} · {{title}}',
      sortable_fields: { fields: ['order', 'year', 'title'], default: { field: 'order', direction: 'ascending' } },
      view_groups: [{ label: '분류', field: 'category' }],
      thumbnail: 'images.*.image',
      fields: [
        { name: 'title', label: '제목 (한국어)', widget: 'string' },
        { name: 'title_en', label: '제목 (English)', widget: 'string', required: false },
        {
          name: 'category',
          label: '분류 (전시실)',
          widget: 'select',
          default: 'painting',
          options: [
            { label: '회화 Painting', value: 'painting' },
            { label: '콩테 · 파스텔 Conté & Pastel', value: 'conte-pastel' },
            { label: '디지털 Digital', value: 'digital' },
            { label: '음악 Music', value: 'music' },
            { label: '영화 Film', value: 'film' },
            { label: '그 밖의 작업 Other', value: 'etc' },
          ],
        },
        { name: 'year', label: '연도', widget: 'string', required: false, hint: '예: 2024 또는 2019–2021' },
        { name: 'medium', label: '재료 / 형식 (한국어)', widget: 'string', required: false, hint: '예: 캔버스에 유채 · 종이에 콩테 · 피아노' },
        { name: 'medium_en', label: '재료 / 형식 (English)', widget: 'string', required: false, hint: 'e.g. Oil on canvas' },
        { name: 'size', label: '크기', widget: 'string', required: false, hint: '예: 72.7 × 60.6 cm' },
        {
          name: 'images',
          label: '이미지',
          label_singular: '이미지',
          widget: 'list',
          required: false,
          hint: '첫 번째 이미지가 대표 이미지가 됩니다. 끌어서 순서를 바꿀 수 있습니다.',
          summary: '{{caption}}',
          fields: [
            { name: 'image', label: '이미지 파일', widget: 'image', hint: imageHint },
            { name: 'caption', label: '캡션 (한국어, 선택)', widget: 'string', required: false, hint: '예: 부분' },
            { name: 'caption_en', label: 'Caption (English, optional)', widget: 'string', required: false },
          ],
        },
        { name: 'cover', label: '대표 이미지 (선택)', widget: 'image', required: false, hint: '비워 두면 위 이미지 목록의 첫 번째가 쓰입니다.' },
        { name: 'description', label: '설명 (한국어)', widget: 'text', required: false },
        { name: 'description_en', label: 'Description (English)', widget: 'text', required: false },
        {
          name: 'audio',
          label: '음원 파일 (음악)',
          widget: 'file',
          required: false,
          media_folder: '/public/media/audio',
          public_folder: '/media/audio',
          accept: 'audio/*',
          hint: 'MP3 권장. 올리면 사이트 하단의 미니 플레이어로 재생됩니다.',
        },
        { name: 'link', label: '외부 링크 (SoundCloud · YouTube · Vimeo)', widget: 'string', required: false, hint: '음원 파일 대신 또는 함께, 작품 페이지에 플레이어로 표시됩니다.' },
        { name: 'featured', label: '대표작 (첫 화면 空 안에 보이고 "대표작"에 걸림)', widget: 'boolean', default: false, required: false },
        { name: 'order', label: '순서 (작을수록 앞)', widget: 'number', value_type: 'int', required: false, hint: '비워 두면 최신 연도 순으로 뒤쪽에 걸립니다.' },
        { name: 'draft', label: '비공개 (사이트에 숨기기)', widget: 'boolean', default: false, required: false },
      ],
    },
    {
      name: 'pages',
      label: '소개',
      files: [
        {
          name: 'about',
          label: '소개 페이지',
          file: 'src/content/pages/about.md',
          fields: [
            { name: 'title', label: '페이지 제목 (한국어)', widget: 'string', required: false },
            { name: 'title_en', label: 'Page title (English)', widget: 'string', required: false },
            { name: 'portrait', label: '프로필 사진', widget: 'image', required: false, hint: imageHint },
            { name: 'bio', label: '소개 글 (한국어)', widget: 'text', required: false },
            { name: 'bio_en', label: 'Biography (English)', widget: 'text', required: false },
            {
              name: 'cv',
              label: '약력',
              label_singular: '약력 항목',
              widget: 'list',
              required: false,
              summary: '{{year}} · {{text}}',
              fields: [
                { name: 'year', label: '연도', widget: 'string', required: false },
                { name: 'text', label: '내용 (한국어)', widget: 'string', required: false },
                { name: 'text_en', label: 'Text (English)', widget: 'string', required: false },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'settings',
      label: '사이트 설정',
      files: [
        {
          name: 'site',
          label: '사이트 설정',
          file: 'src/content/settings/site.yml',
          fields: [
            { name: 'site_title', label: '사이트 이름', widget: 'string', required: false },
            { name: 'name', label: '이름 (한국어)', widget: 'string', required: false },
            { name: 'name_en', label: 'Name (English)', widget: 'string', required: false },
            { name: 'roles', label: '하는 일 (한국어)', widget: 'string', required: false },
            { name: 'roles_en', label: 'Roles (English)', widget: 'string', required: false },
            { name: 'hero_text', label: '첫 화면 글자', widget: 'string', required: false, hint: '현재 디자인은 空 을 사용합니다.' },
            { name: 'hero_image', label: '첫 화면 그림 (대표작이 없을 때)', widget: 'image', required: false },
            { name: 'intro', label: '인사말 (한국어)', widget: 'string', required: false },
            { name: 'intro_en', label: 'Greeting (English)', widget: 'string', required: false },
            { name: 'description', label: '검색엔진 설명 (한국어)', widget: 'text', required: false },
            { name: 'description_en', label: 'Search description (English)', widget: 'text', required: false },
            { name: 'email', label: '이메일', widget: 'string', required: false },
            { name: 'instagram', label: 'Instagram 주소', widget: 'string', required: false },
            {
              name: 'links',
              label: '그 밖의 링크',
              label_singular: '링크',
              widget: 'list',
              required: false,
              fields: [
                { name: 'label', label: '이름', widget: 'string' },
                { name: 'url', label: '주소', widget: 'string' },
              ],
            },
          ],
        },
      ],
    },
  ],
};

/** Minimal YAML emitter (keys/strings/numbers/bools/arrays/objects). */
function yaml(v: unknown, indent = 0): string {
  const pad = '  '.repeat(indent);
  const scalar = (x: unknown) => (typeof x === 'string' ? JSON.stringify(x) : String(x));
  if (Array.isArray(v)) return v.map((x) => (x && typeof x === 'object' ? `${pad}-\n${yaml(x, indent + 1)}` : `${pad}- ${scalar(x)}`)).join('\n');
  if (v && typeof v === 'object')
    return Object.entries(v as Record<string, unknown>)
      .filter(([, x]) => x !== undefined)
      .map(([k, x]) => (x && typeof x === 'object' ? `${pad}${k}:\n${yaml(x, indent + 1)}` : `${pad}${k}: ${scalar(x)}`))
      .join('\n');
  return pad + scalar(v);
}

export const configObject = config;
export const GET: APIRoute = () => new Response(`# Generated from src/pages/admin/config.yml.ts\n${yaml(config)}\n`, { headers: { 'Content-Type': 'text/yaml; charset=utf-8' } });
