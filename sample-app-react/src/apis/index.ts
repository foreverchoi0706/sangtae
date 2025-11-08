/**
 * @description 포스트 인터페이스
 */
export interface Post {
  userId: number;
  id: number;
  title: string;
  body: string;
}

/**
 * @description 모든 포스트를 조회하는 함수
 * @returns {Promise<Post[]>} 포스트 데이터
 */
export const getPosts = async (): Promise<Post[]> => {
  const res = await fetch("https://jsonplaceholder.typicode.com/posts");
  if (!res.ok || res.status >= 400) {
    throw new Error("Failed to fetch posts");
  }
  return await res.json();
};

/**
 * @description 특정 포스트를 조회하는 함수
 * @param {number} id 포스트 ID
 * @returns {Promise<Post>} 포스트 데이터
 */
export const getPost = async (id: number): Promise<Post> => {
  const res = await fetch(`https://jsonplaceholder.typicode.com/posts/${id}`);
  if (!res.ok || res.status >= 400) {
    throw new Error("Failed to fetch posts");
  }
  return await res.json();
};
