import type { APIRoute } from 'astro';
import { SITE, BASE, GITHUB_OWNER, GITHUB_REPO } from '../../../site.config.mjs';

/**
 * Sveltia CMS configuration, generated so the site URL and base path always match
 * site.config.mjs. Everything the owner sees is in Korean.
 *
 * Sidebar order: 사이트 설정, 회화, 콩테·파스텔, 디지털, 영화, 음악, 소개.
 *
 * Art categories are ONE file each (src/content/art/<category>.yml) holding the list
 * of works, because that is what gives drag-and-drop ordering of the works in
 * Sveltia. Bulk upload uses the Image field's `multiple` option (drop or pick many
 * files at once); on save, the hook in admin/index.astro turns those images into
 * works at the top of the list.
 */
const siteUrl = SITE + BASE;
const UPLOAD_HINT = '2000–3000px 크기의 JPG를 권장합니다. 올리면 자동으로 웹용(WebP, 긴 변 최대 3000px)으로 저장됩니다.';

const folder = (sub: string) => ({ media_folder: `/src/assets/media/${sub}`, public_folder: `/src/assets/media/${sub}` });

const art = (name: string, label: string) => ({
  name,
  label,
  description: `${label} 작품. 위에서부터 사이트에 보이는 순서입니다.`,
  files: [
    {
      name: 'works',
      label: `${label} 작품`,
      file: `src/content/art/${name}.yml`,
      fields: [
        {
          name: 'bulk',
          label: '여러 장 한꺼번에 올리기',
          widget: 'image',
          multiple: true,
          required: false,
          ...folder(name),
          hint: `그림 파일을 여기로 여러 장 끌어다 놓거나 한꺼번에 고르세요. "저장"을 누르면 아래 작품 목록 맨 위에 하나씩 들어갑니다. ${UPLOAD_HINT}`,
        },
        {
          name: 'works',
          label: '작품 목록 (끌어서 순서 바꾸기)',
          label_singular: '작품',
          widget: 'list',
          required: false,
          collapsed: true,
          add_to_top: true,
          thumbnail: 'image',
          summary: "{{fields.title_ko}} {{fields.title_en}} {{fields.year}} {{fields.hidden | ternary('· 숨김', '')}}",
          hint: '왼쪽 손잡이를 끌어 순서를 바꿉니다. 작품을 누르면 제목·연도 등을 적을 수 있어요. 지우지 않고 사이트에서만 감추려면 "숨기기"를 켜세요.',
          fields: [
            { name: 'image', label: '이미지', widget: 'image', required: true, ...folder(name), hint: UPLOAD_HINT },
            { name: 'title_en', label: '제목 (영어)', widget: 'string', required: false, hint: '제목이 없으면 비워 두세요. 비워 두면 사이트에 제목이 나오지 않습니다.' },
            { name: 'title_ko', label: '제목 (한국어)', widget: 'string', required: false, hint: '한국어 화면(KR)에서 보입니다. 비워 두면 영어 제목이 나옵니다.' },
            { name: 'year', label: '연도', widget: 'string', required: false, hint: '예: 2024' },
            { name: 'material', label: '재료', widget: 'string', required: false, hint: '예: Oil on canvas' },
            { name: 'size', label: '크기', widget: 'string', required: false, hint: '예: 530 × 455 mm' },
            { name: 'note', label: '메모', widget: 'string', required: false, hint: '작품을 크게 볼 때 캡션 끝에 붙는 짧은 글' },
            {
              name: 'display',
              label: '화면 크기',
              widget: 'select',
              default: 'M',
              options: [
                { label: 'S — 작게', value: 'S' },
                { label: 'M — 보통', value: 'M' },
                { label: 'L — 크게', value: 'L' },
              ],
              hint: '작품 목록 화면에서 이 작품이 얼마나 크게 걸릴지 정합니다.',
            },
            { name: 'hidden', label: '숨기기', widget: 'boolean', default: false, required: false, hint: '켜면 사이트에서 보이지 않습니다 (지워지지 않아요).' },
            {
              name: 'process',
              label: '과정 영상 (선택)',
              widget: 'string',
              required: false,
              hint: 'YouTube·Vimeo 주소나 퍼가기(embed) 주소. 넣으면 작품을 크게 볼 때 "과정" 버튼이 생깁니다.',
            },
          ],
        },
      ],
    },
  ],
});

const config = {
  backend: {
    name: 'github',
    repo: `${GITHUB_OWNER}/${GITHUB_REPO}`,
    branch: 'main',
    auth_methods: ['token'],
    commit_messages: {
      create: '추가: {{slug}}',
      update: '수정: {{slug}}',
      delete: '삭제: {{slug}}',
      uploadMedia: '이미지 업로드: {{path}}',
      deleteMedia: '이미지 삭제: {{path}}',
    },
  },
  app_title: 'gollshow 관리자',
  site_url: siteUrl,
  display_url: siteUrl,
  logo: { src: `${siteUrl}apple-touch-icon.png` },
  media_folder: 'src/assets/media',
  public_folder: '/src/assets/media',
  media_libraries: {
    default: {
      config: {
        max_file_size: 52428800,
        transformations: {
          raster_image: { format: 'webp', quality: 90, width: 3000, height: 3000 },
        },
      },
    },
  },
  slug: { encoding: 'ascii', clean_accents: true, sanitize_replacement: '-' },
  collections: [
    {
      name: 'settings',
      label: '사이트 설정',
      description: '메뉴 이름, 연락처, 첫 화면의 글자와 물감 색',
      files: [
        {
          name: 'site',
          label: '사이트 설정',
          file: 'src/content/settings/site.yml',
          fields: [
            { name: 'wordmark', label: '첫 화면 글자', widget: 'string', default: 'gollshow', hint: '첫 화면에서 물감 속에서 모여드는 글자, 그리고 각 페이지 왼쪽 위의 작은 글자입니다.' },
            {
              name: 'pigments',
              label: '첫 화면 물감 색',
              widget: 'object',
              collapsed: false,
              hint: '첫 화면에서 소용돌이치는 네 가지 물감 색입니다. 바꾸고 저장하면 몇 분 뒤 사이트에 반영됩니다.',
              fields: [
                { name: 'ultramarine', label: '물감 1 (기본: 울트라마린)', widget: 'color', default: '#1C2B94', allowInput: true },
                { name: 'vermilion', label: '물감 2 (기본: 버밀리언)', widget: 'color', default: '#DB3821', allowInput: true },
                { name: 'viridian', label: '물감 3 (기본: 비리디언)', widget: 'color', default: '#0A6B5C', allowInput: true },
                { name: 'ochre', label: '물감 4 (기본: 오커)', widget: 'color', default: '#F2B833', allowInput: true },
              ],
            },
            {
              name: 'menu',
              label: '메뉴 이름',
              widget: 'object',
              collapsed: true,
              hint: '사이트 위쪽 메뉴에 보이는 이름. 영어는 기본 화면, 한국어는 KR을 눌렀을 때 보입니다.',
              fields: [
                { name: 'painting_en', label: '회화 (영어)', widget: 'string', default: 'Painting' },
                { name: 'painting_ko', label: '회화 (한국어)', widget: 'string', default: '회화' },
                { name: 'conte_en', label: '콩테·파스텔 (영어)', widget: 'string', default: 'Conté & Pastel' },
                { name: 'conte_ko', label: '콩테·파스텔 (한국어)', widget: 'string', default: '콩테·파스텔' },
                { name: 'digital_en', label: '디지털 (영어)', widget: 'string', default: 'Digital' },
                { name: 'digital_ko', label: '디지털 (한국어)', widget: 'string', default: '디지털' },
                { name: 'film_en', label: '영화 (영어)', widget: 'string', default: 'Film' },
                { name: 'film_ko', label: '영화 (한국어)', widget: 'string', default: '영화' },
                { name: 'music_en', label: '음악 (영어)', widget: 'string', default: 'Music' },
                { name: 'music_ko', label: '음악 (한국어)', widget: 'string', default: '음악' },
                { name: 'about_en', label: '소개 (영어)', widget: 'string', default: 'About' },
                { name: 'about_ko', label: '소개 (한국어)', widget: 'string', default: '소개' },
              ],
            },
            { name: 'email', label: '연락 이메일', widget: 'string', required: false },
            { name: 'instagram', label: 'Instagram 주소', widget: 'string', required: false },
            { name: 'youtube', label: 'YouTube 주소', widget: 'string', required: false },
            {
              name: 'links',
              label: '그 밖의 SNS·링크',
              label_singular: '링크',
              widget: 'list',
              required: false,
              summary: '{{fields.label}}',
              fields: [
                { name: 'label', label: '이름', widget: 'string' },
                { name: 'url', label: '주소', widget: 'string' },
              ],
            },
            { name: 'site_title', label: '사이트 이름 (브라우저 탭)', widget: 'string', required: false, default: 'gollshow' },
            { name: 'name_en', label: '이름 (영어)', widget: 'string', required: false },
            { name: 'name_ko', label: '이름 (한국어)', widget: 'string', required: false },
            { name: 'roles_en', label: '하는 일 (영어)', widget: 'string', required: false, hint: '예: Film director · Painter · Composer' },
            { name: 'roles_ko', label: '하는 일 (한국어)', widget: 'string', required: false },
            { name: 'description_en', label: '검색엔진 설명 (영어)', widget: 'text', required: false },
            { name: 'description_ko', label: '검색엔진 설명 (한국어)', widget: 'text', required: false },
          ],
        },
      ],
    },
    art('painting', '회화'),
    art('conte-pastel', '콩테·파스텔'),
    art('digital', '디지털'),
    {
      name: 'films',
      label: '영화',
      label_singular: '영화',
      description: '영화 한 편이 항목 하나입니다. "공개"를 켜야 사이트에 나옵니다. "예시 영화"를 열어 보면 어떻게 채우는지 알 수 있어요.',
      folder: 'src/content/films',
      create: true,
      extension: 'md',
      format: 'frontmatter',
      slug: '{{title_en}}',
      identifier_field: 'title_en',
      summary: "{{title_ko}} {{title_en}} · {{year}} {{published | ternary('', '· 비공개')}}",
      thumbnail: 'still',
      reorder: true,
      sortable_fields: ['year', 'title_en'],
      fields: [
        { name: 'published', label: '공개', widget: 'boolean', default: false, hint: '켜면 사이트의 영화 페이지에 나옵니다. 다 채울 때까지 꺼 두세요.' },
        { name: 'title_en', label: '제목 (영어)', widget: 'string', hint: '꼭 적어 주세요. 영화 페이지 주소(URL)도 이 제목으로 만들어집니다.' },
        { name: 'title_ko', label: '제목 (한국어)', widget: 'string', required: false },
        { name: 'year', label: '연도', widget: 'string', required: false, hint: '예: 2025' },
        { name: 'runtime', label: '상영 시간 (분)', widget: 'string', required: false, hint: '숫자만 적으면 "98 min / 98분"으로 나옵니다.' },
        { name: 'role_en', label: '맡은 일 (영어)', widget: 'string', required: false, hint: '예: Director · Writer' },
        { name: 'role_ko', label: '맡은 일 (한국어)', widget: 'string', required: false, hint: '예: 감독 · 각본' },
        { name: 'logline_en', label: '한 줄 소개 (영어)', widget: 'string', required: false },
        { name: 'logline_ko', label: '한 줄 소개 (한국어)', widget: 'string', required: false },
        { name: 'still', label: '대표 스틸', widget: 'image', required: false, ...folder('film'), hint: `영화 목록에 가로로 길게(2.39:1) 잘려 보입니다. ${UPLOAD_HINT}` },
        {
          name: 'focus',
          label: '대표 스틸에서 살릴 부분',
          widget: 'select',
          default: 'center',
          options: [
            { label: '가운데', value: 'center' },
            { label: '위', value: 'top' },
            { label: '아래', value: 'bottom' },
            { label: '왼쪽', value: 'left' },
            { label: '오른쪽', value: 'right' },
            { label: '왼쪽 위', value: 'left top' },
            { label: '오른쪽 위', value: 'right top' },
            { label: '왼쪽 아래', value: 'left bottom' },
            { label: '오른쪽 아래', value: 'right bottom' },
          ],
          hint: '가로로 길게 잘릴 때 어느 쪽을 남길지 고릅니다.',
        },
        { name: 'trailer', label: '예고편 주소', widget: 'string', required: false, hint: 'YouTube 또는 Vimeo 주소. 누르기 전까지는 대표 스틸과 재생 버튼만 보입니다.' },
        { name: 'synopsis_en', label: '시놉시스 (영어)', widget: 'text', required: false, hint: '빈 줄을 넣으면 새 문단이 됩니다.' },
        { name: 'synopsis_ko', label: '시놉시스 (한국어)', widget: 'text', required: false },
        { name: 'stills', label: '스틸 (여러 장)', widget: 'image', multiple: true, required: false, ...folder('film'), hint: `여러 장을 한꺼번에 올리고 끌어서 순서를 바꿀 수 있어요. ${UPLOAD_HINT}` },
        {
          name: 'credits',
          label: '크레딧',
          label_singular: '크레딧',
          widget: 'list',
          required: false,
          collapsed: true,
          summary: '{{fields.role_ko}} {{fields.role_en}}',
          fields: [
            { name: 'role_en', label: '역할 (영어)', widget: 'string', required: false, hint: '예: Cinematography' },
            { name: 'role_ko', label: '역할 (한국어)', widget: 'string', required: false, hint: '예: 촬영' },
            { name: 'names', label: '이름', widget: 'list', required: false, hint: '한 줄에 한 사람씩 적으세요.' },
          ],
        },
        {
          name: 'festivals',
          label: '영화제·수상',
          label_singular: '영화제·수상',
          widget: 'list',
          required: false,
          collapsed: true,
          summary: '{{fields.year}} {{fields.text_ko}}',
          fields: [
            { name: 'year', label: '연도', widget: 'string', required: false },
            { name: 'text_en', label: '내용 (영어)', widget: 'string', required: false, hint: '예: Busan International Film Festival — New Currents' },
            { name: 'text_ko', label: '내용 (한국어)', widget: 'string', required: false },
          ],
        },
        {
          name: 'links',
          label: '외부 링크',
          label_singular: '링크',
          widget: 'list',
          required: false,
          collapsed: true,
          summary: '{{fields.label}}',
          fields: [
            { name: 'label', label: '이름', widget: 'string' },
            { name: 'url', label: '주소', widget: 'string' },
          ],
        },
      ],
    },
    {
      name: 'music',
      label: '음악',
      files: [
        {
          name: 'music',
          label: '음악 페이지',
          file: 'src/content/pages/music.md',
          fields: [
            { name: 'name', label: '이름', widget: 'string', required: false, hint: '지금은 gogolala' },
            { name: 'intro_en', label: '소개 글 (영어, 선택)', widget: 'text', required: false },
            { name: 'intro_ko', label: '소개 글 (한국어, 선택)', widget: 'text', required: false },
            {
              name: 'links',
              label: '플랫폼 링크',
              label_singular: '링크',
              widget: 'list',
              required: false,
              summary: '{{fields.label}}',
              hint: 'Spotify 주소가 있으면 페이지에 플레이어가 함께 나옵니다 (누르면 열림).',
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
      name: 'about',
      label: '소개',
      files: [
        {
          name: 'about',
          label: '소개 페이지',
          file: 'src/content/pages/about.md',
          fields: [
            { name: 'bio_en', label: '소개 글 (영어)', widget: 'text', required: false, hint: '빈 줄을 넣으면 새 문단이 됩니다.' },
            { name: 'bio_ko', label: '소개 글 (한국어)', widget: 'text', required: false, hint: '비워 두면 한국어 화면에서도 영어 글이 나옵니다.' },
            { name: 'portrait', label: '사진·포스터', widget: 'image', required: false, ...folder('about'), hint: UPLOAD_HINT },
            { name: 'video', label: '영상 주소', widget: 'string', required: false, hint: 'YouTube·Vimeo 주소나 퍼가기(embed) 주소. 지금은 KBS 뉴스 영상(Adobe)입니다.' },
            { name: 'video_caption_en', label: '영상 설명 (영어)', widget: 'string', required: false },
            { name: 'video_caption_ko', label: '영상 설명 (한국어)', widget: 'string', required: false },
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
