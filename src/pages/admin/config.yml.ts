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
    auth_methods: ['token'],
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
      description: '그림·드로잉·디지털·음악·영화 작품. "분류"에 따라 해당 릴(전시실)과 첫 화면의 벽에 걸립니다. 제목이 없으면 "회화 017"처럼 릴 이름과 순서로 표시됩니다.',
      folder: 'src/content/works',
      create: true,
      extension: 'md',
      format: 'frontmatter',
      // 제목이 없어도 되도록, 파일 이름은 분류 + 짧은 무작위 문자로 만듭니다 (예: painting-1a2b3c4d).
      slug: '{{category}}-{{uuid_shorter}}',
      identifier_field: 'title',
      summary: '{{category}} · {{order}} · {{title}}',
      sortable_fields: { fields: ['order', 'year', 'title'], default: { field: 'order', direction: 'ascending' } },
      view_groups: [{ label: '분류', field: 'category' }],
      thumbnail: 'images.*.image',
      fields: [
        { name: 'title', label: '제목 (한국어, 선택)', widget: 'string', required: false, hint: '없으면 비워 두세요. 사이트에는 "회화 017"처럼 릴 이름과 순서가 나옵니다. 제목을 지어내 넣지 마세요.' },
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
        { name: 'size', label: '크기', widget: 'string', required: false, hint: '예: 1200x870mm 또는 72.7 × 60.6 cm. 입력하면 첫 화면의 벽에 실제 크기 비율로 걸립니다. 비워 두면 모든 작품이 같은 기본 크기로 걸립니다.' },
        {
          name: 'images',
          label: '이미지',
          label_singular: '이미지',
          widget: 'list',
          required: false,
          hint: '첫 번째 이미지가 벽과 릴에 걸립니다. 끌어서 순서를 바꿀 수 있습니다. 색은 사이트가 그림에서 자동으로 뽑습니다(빛의 색).',
          summary: '{{caption}}',
          fields: [
            { name: 'image', label: '이미지 파일', widget: 'image', hint: imageHint },
            { name: 'caption', label: '캡션 (한국어, 선택)', widget: 'string', required: false, hint: '예: 부분' },
            { name: 'caption_en', label: 'Caption (English, optional)', widget: 'string', required: false },
          ],
        },
        { name: 'cover', label: '공유용 이미지 (선택)', widget: 'image', required: false, hint: '링크를 공유할 때 보이는 그림. 비워 두면 위 이미지 목록의 첫 번째가 쓰입니다. 이미지 목록이 비어 있으면 이 그림이 벽에 걸립니다.' },
        { name: 'description', label: '설명 (한국어)', widget: 'text', required: false },
        { name: 'description_en', label: 'Description (English)', widget: 'text', required: false },
        {
          name: 'audio',
          label: '음원 파일 (음악)',
          widget: 'file',
          required: false,
          media_folder: '/public/media/audio',
          public_folder: '/media/audio',
          accept: 'audio/mpeg,audio/mp4,audio/x-m4a,audio/aac,.mp3,.m4a',
          hint: 'MP3 또는 M4A. 올리면 음악 페이지에 곡이 나오고, 재생하면 사운드트랙에 파형이 새겨지며 다른 페이지로 옮겨도 계속 재생됩니다.',
        },
        { name: 'link', label: '외부 링크 (SoundCloud · YouTube · Vimeo)', widget: 'string', required: false, hint: '작품 페이지에 누르면 열리는 플레이어로 표시됩니다.' },
        { name: 'video', label: '영상 (작업 과정 등, 선택)', widget: 'string', required: false, hint: 'YouTube·Vimeo 주소, 또는 Adobe 등의 퍼가기(embed) 주소. 작품 페이지에 영상으로 나옵니다. Adobe 영상은 Adobe 계정에 달려 있습니다.' },
        { name: 'order', label: '순서 (작을수록 앞)', widget: 'number', value_type: 'int', required: false, hint: '릴 안의 순서이자 벽에 걸리는 순서. 옛 사이트에서 가져온 작품은 101, 102 … 입니다. 비워 두면 뒤쪽에 걸립니다.' },
        { name: 'draft', label: '비공개 (사이트에 숨기기)', widget: 'boolean', default: false, required: false },
      ],
    },
    {
      name: 'pages',
      label: '페이지',
      files: [
        {
          name: 'about',
          label: '소개 페이지',
          file: 'src/content/pages/about.md',
          fields: [
            { name: 'title', label: '페이지 제목 (한국어)', widget: 'string', required: false },
            { name: 'title_en', label: 'Page title (English)', widget: 'string', required: false },
            { name: 'portrait', label: '사진', widget: 'image', required: false, hint: imageHint },
            { name: 'bio', label: '소개 글 (한국어)', widget: 'text', required: false, hint: '줄을 바꾸면 크레딧에서도 줄이 바뀝니다.' },
            { name: 'bio_en', label: 'Biography (English)', widget: 'text', required: false, hint: '비워 두면 영어 화면에서도 위 글이 나옵니다.' },
            { name: 'video', label: '영상 (embed 주소)', widget: 'string', required: false, hint: '지금은 KBS 뉴스 영상(Adobe). Adobe 영상은 Adobe 계정에 달려 있습니다.' },
            { name: 'video_caption', label: '영상 캡션', widget: 'string', required: false },
            { name: 'video_caption_en', label: 'Video caption (English)', widget: 'string', required: false },
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
        {
          name: 'music',
          label: '음악 페이지',
          file: 'src/content/pages/music.md',
          fields: [
            { name: 'title', label: '페이지 제목 (한국어)', widget: 'string', required: false },
            { name: 'title_en', label: 'Page title (English)', widget: 'string', required: false },
            { name: 'name', label: '이름', widget: 'string', required: false, hint: '지금은 gogolala' },
            {
              name: 'links',
              label: '플랫폼 링크',
              label_singular: '링크',
              widget: 'list',
              required: false,
              summary: '{{label}}',
              fields: [
                { name: 'label', label: '이름 (예: Spotify)', widget: 'string' },
                { name: 'url', label: '주소', widget: 'string' },
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
