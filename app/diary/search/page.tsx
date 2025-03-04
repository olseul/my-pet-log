"use client";
import { getSearchDiary, getSearchTerms } from "@/app/_api/diary";
import Spinner from "@/app/_components/Spinner";
import { useInfiniteScroll } from "@/app/_hooks/useInfiniteScroll";
import { DIARY_SEARCH_PAGE_SIZE } from "@/app/diary/(diary)/constant";
import { Diaries } from "@/app/diary/_components/Diary";
import BackIcon from "@/public/icons/chevron-left.svg?url";
import SearchIconURL from "@/public/icons/search.svg?url";
import NoResultImage from "@/public/images/no-search-result.png";
import { useInfiniteQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { IoIosCloseCircle } from "react-icons/io";
import * as styles from "./style.css";

const NoResult = () => {
  return (
    <div className={styles.noResultWrapper}>
      <Image src={NoResultImage} alt="검색 결과 없음 이미지" width={200} height={200} />
      <p className={styles.noResultText}>일치하는 결과가 없어요</p>
    </div>
  );
};

const SearchIntro = () => {
  const [keyword, setKeyword] = useState([]);

  useEffect(() => {
    const loadKeyword = async () => {
      const res = await getSearchTerms();
      setKeyword(res.terms);
    };
    loadKeyword();
  }, []);

  return (
    <div className={styles.searchIntroWrapper}>
      {keyword?.map((keyword, idx) => {
        return (
          <Link href={`/diary/search?keyword=${keyword}`} replace={true} key={idx} className={styles.recommendKey}>
            <div>{keyword}</div>
          </Link>
        );
      })}
    </div>
  );
};

const Search = () => {
  const searchParams = useSearchParams();
  const keyword = searchParams.get("keyword");

  const { data, isLoading, hasNextPage, fetchNextPage } = useInfiniteQuery({
    queryKey: ["search", keyword],
    queryFn: ({ pageParam }) => getSearchDiary({ page: pageParam, size: DIARY_SEARCH_PAGE_SIZE, keyword }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages, lastPageParam, allPageParams) => (lastPage?.last ? undefined : lastPageParam + 1),
    enabled: !!keyword,
    staleTime: 0,
  });
  const { targetRef, setTargetActive } = useInfiniteScroll({ callbackFunc: fetchNextPage });

  useEffect(() => {
    setTargetActive((prev) => !prev);
  }, [data]);

  if (!keyword) return <SearchIntro />;
  if (isLoading) return <Spinner />;
  if (!data?.pages[0]?.content.length) return <NoResult />;
  return (
    <>
      {data.pages.map((page, idx) => (
        <div key={idx}>{page && <Diaries data={page?.content} prevData={idx !== 0 ? data.pages[idx - 1]?.content || null : null} />}</div>
      ))}
      {/* 로딩중이 아니고 다음 페이지가 있을 때 무한스크롤됨 */}
      {!isLoading && hasNextPage && <div ref={targetRef} />}
    </>
  );
};

const SearchPage = () => {
  const searchParams = useSearchParams();
  const keyword = searchParams.get("keyword");
  const [searchValue, setSearchValue] = useState(keyword);
  const router = useRouter();

  useEffect(() => {
    //추천 키워드로 검색했을 때 url의 keyword가 input에 적용안됨 해결
    setSearchValue(keyword);
  }, [keyword]);

  return (
    <div className={styles.root}>
      <div className={styles.container}>
        <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
          <Link href={"/diary/my-pet"}>
            <Image src={BackIcon} alt="backward icon" width={25} height={25} style={{ cursor: "pointer" }} />
          </Link>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              router.replace(`/diary/search?keyword=${searchValue}`);
            }}
            style={{ position: "relative", width: "100%" }}
          >
            <input
              className={styles.search}
              value={searchValue ?? ""}
              onChange={(e) => {
                setSearchValue(e.target.value);
                if (!e.target.value) router.replace("/diary/search");
              }}
              placeholder="제목, 내용으로 검색"
            />
            <div className={styles.searchIcon}>
              {searchValue ? (
                <IoIosCloseCircle
                  className={styles.deleteIcon}
                  onClick={() => {
                    setSearchValue("");
                    router.replace("/diary/search");
                  }}
                />
              ) : (
                <div className={styles.deleteIcon} />
              )}
              <button>
                <Image src={SearchIconURL} alt="search icon" width={19} height={19} />
              </button>
            </div>
          </form>
        </div>

        <Search />
      </div>
    </div>
  );
};

export default SearchPage;
