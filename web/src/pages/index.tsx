import { NavBar } from "../components/NavBar";
import { withUrqlClient } from "next-urql";
import { createUrqlClient } from "../utils/createUrqlClient";
import { useGetPostsQuery } from "../generated/graphql";

const Index = () => {
  const [{ data }] = useGetPostsQuery();
  return (
    <>
      <NavBar />
      <div>hello world</div>
      <br></br>
      {!data ? (
        <div>Loading...</div>
      ) : (
        data.getPosts.map((p) => <div key={p.id}>{p.title}</div>)
      )}
    </>
  );
};
export default withUrqlClient(createUrqlClient, { ssr: true })(Index);
