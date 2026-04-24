export const getBlogs = async () => {
    const res = await fetch("http://localhost:4000/api/blogs");
    return res.json();
  };
  
  export const getBlogBySlug = async (slug) => {
    const res = await fetch(`http://localhost:4000/api/blogs/${slug}`);
    return res.json();
  };
  
  export const createBlog = async (data) => {
    const res = await fetch("http://localhost:4000/api/blogs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
  
    return res.json();
  };