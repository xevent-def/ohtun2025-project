// API 설정
const API_BASE_URL = 'http://crud.tlol.me';
const USER_ID = 'xevent-def';
const RESOURCE_POST = 'post';
const RESOURCE_COMMENT = 'comment';

// DOM 요소
const postList = document.getElementById('postList');
const postModal = document.getElementById('postModal');
const postDetailModal = document.getElementById('postDetailModal');
const writePostBtn = document.getElementById('writePostBtn');
const postForm = document.getElementById('postForm');
const commentForm = document.getElementById('commentForm');
const closeButtons = document.querySelectorAll('.close');

// 현재 선택된 게시글 ID
let currentPostId = null;

// 모달 닫기 이벤트
closeButtons.forEach(button => {
    button.onclick = function() {
        postModal.style.display = 'none';
        postDetailModal.style.display = 'none';
    }
});

// 글쓰기 버튼 클릭 이벤트
writePostBtn.onclick = function() {
    postModal.style.display = 'block';
}

// 게시글 작성
postForm.onsubmit = async function(e) {
    e.preventDefault();
    const title = document.getElementById('postTitle').value;
    const content = document.getElementById('postContent').value;    try {
        const response = await fetch(`${API_BASE_URL}/${USER_ID}/${RESOURCE_POST}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title,
                content,
                createdAt: new Date().toISOString()
            })
        });

        if (response.ok) {
            postModal.style.display = 'none';
            postForm.reset();
            loadPosts();
        } else {
            throw new Error('게시글 작성에 실패했습니다.');
        }
    } catch (error) {
        alert(error.message);
    }
};

// 댓글 작성
commentForm.onsubmit = async function(e) {
    e.preventDefault();
    const content = document.getElementById('commentContent').value;

    try {
        const response = await fetch(`${API_BASE_URL}/${USER_ID}/${RESOURCE_COMMENT}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                content,
                postId: currentPostId
            })
        });

        if (response.ok) {
            commentForm.reset();
            loadComments(currentPostId);
        } else {
            throw new Error('댓글 작성에 실패했습니다.');
        }
    } catch (error) {
        alert(error.message);
    }
};

// 페이지네이션 상태
let currentPage = 1;
const postsPerPage = 10;
let totalPosts = 0;

// 게시글 목록 불러오기 (서버 페이지네이션 기반)
async function loadPosts(page = 1) {
    try {
        const response = await fetch(`${API_BASE_URL}/${USER_ID}/${RESOURCE_POST}?page=${page}&pageSize=${postsPerPage}`);
        const posts = await response.json();
        totalPosts = posts.total;
        currentPage = posts.page;
        displayCurrentPage(posts.data);
        updatePaginationControls();
    } catch (error) {
        alert('게시글을 불러오는데 실패했습니다.');
    }
}

// 현재 페이지 표시 (서버 데이터 사용)
function displayCurrentPage(currentPosts) {
    postList.innerHTML = '';
    currentPosts.forEach(post => {
        const postElement = createPostElement(post);
        postList.appendChild(postElement);
    });
    document.getElementById('currentPage').textContent = currentPage;
}

// 페이지네이션 컨트롤 업데이트 (서버 total 기반)
function updatePaginationControls() {
    const totalPages = Math.ceil(totalPosts / postsPerPage);
    const prevButton = document.getElementById('prevPage');
    const nextButton = document.getElementById('nextPage');
    const currentPageSpan = document.getElementById('currentPage');
    let pageNumbers = document.getElementById('pageNumbers');
    if (!pageNumbers) {
        pageNumbers = document.createElement('span');
        pageNumbers.id = 'pageNumbers';
        currentPageSpan.parentNode.insertBefore(pageNumbers, nextButton);
    }
    pageNumbers.innerHTML = '';
    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.textContent = i;
        btn.className = 'page-btn' + (i === currentPage ? ' active' : '');
        btn.onclick = () => {
            if (i !== currentPage) loadPosts(i);
        };
        pageNumbers.appendChild(btn);
    }
    prevButton.style.display = currentPage > 1 ? 'block' : 'none';
    nextButton.style.display = currentPage < totalPages ? 'block' : 'none';
    prevButton.onclick = () => {
        if (currentPage > 1) {
            loadPosts(currentPage - 1);
        }
    };
    nextButton.onclick = () => {
        if (currentPage < totalPages) {
            loadPosts(currentPage + 1);
        }
    };
}

// 게시글 요소 생성
function createPostElement(post) {
    const div = document.createElement('div');
    div.className = 'post-item';
    div.innerHTML = `
        <h3 class="post-title">${post.title}</h3>
        <p class="post-meta">작성일: ${new Date(post.createdAt).toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>
    `;
    
    div.onclick = () => showPostDetail(post.id);
    return div;
}

// 게시글 상세 보기
async function showPostDetail(postId) {
    try {
        const response = await fetch(`${API_BASE_URL}/${USER_ID}/${RESOURCE_POST}/${postId}`);
        const post = await response.json();
        
        currentPostId = postId;
        const postDetail = document.getElementById('postDetail');
        postDetail.innerHTML = `
            <h2>${post.title}</h2>
            <p class="post-meta">작성일: ${new Date(post.createdAt).toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>
            <div class="post-content">${post.content}</div>
        `;
        
        postDetailModal.style.display = 'block';
        loadComments(postId);
    } catch (error) {
        alert('게시글을 불러오는데 실패했습니다.');
    }
}

// 댓글 목록 불러오기
async function loadComments(postId) {
    try {
        const response = await fetch(`${API_BASE_URL}/${USER_ID}/${RESOURCE_COMMENT}`);
        const comments = await response.json();
        console.log('댓글 원본:', comments);
        // 혹시 data 속성에 배열이 들어있으면 그걸 사용
        const commentArray = Array.isArray(comments) ? comments : comments.data;
        const filteredComments = commentArray.filter(comment => String(comment.postId) === String(postId));
        console.log('필터링된 댓글:', filteredComments);
        const commentList = document.getElementById('commentList');
        commentList.innerHTML = '';
        
        filteredComments.forEach(comment => {
            const commentElement = createCommentElement(comment);
            commentList.appendChild(commentElement);
        });
    } catch (error) {
        console.error('댓글 불러오기 에러:', error);
        alert('댓글을 불러오는데 실패했습니다.');
    }
}

// 댓글 요소 생성
function createCommentElement(comment) {
    const div = document.createElement('div');
    div.className = 'comment-item';
    div.innerHTML = `
        <p class="comment-content">${comment.content}</p>
        <p class="comment-meta">작성일: ${new Date(comment.createdAt).toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>
    `;
    return div;
}

// 초기 게시글 로딩
loadPosts();
