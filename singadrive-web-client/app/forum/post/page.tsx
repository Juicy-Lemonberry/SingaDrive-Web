'use client'
import React, { useState } from 'react';
import TopNavbar from '@/components/TopNavbar';
import { useSearchParams } from 'next/navigation';
import { Container, Row, Col, ListGroup, Form, Button } from 'react-bootstrap';
import CommentItem from '@/components/forum/post/CommentItem';
import PostContent from '@/components/forum/post/PostContent';

const PostPage = () => {
    const [newComment, setNewComment] = useState('');

    const searchParams = useSearchParams();
    let postID = searchParams.get('p');
    // TODO: Invalidate more elegantly...
    if (postID == null){
        postID = '-1'
    }

    // NOTE: Sample Comment Data...
    const postData = {
    comments: [
        {
        id: 1,
        author: "John Smith",
        content: "Great article! Thanks for the info.",
        datePosted: "2023-11-08",
        votes: 10,
        replies: [
            {
            id: 3,
            author: "Jane Doe",
            content: "Glad you liked it!",
            datePosted: "2023-11-09",
            votes: 5,
            },
            {
            id: 4,
            author: "Mark Green",
            content: "This clarified a lot, thanks!",
            datePosted: "2023-11-09",
            votes: 3,
            },
        ],
        },
        {
        id: 2,
        author: "Alice Brown",
        content: "I've been having a hard time with hooks, but this makes more sense now.",
        datePosted: "2023-11-08",
        votes: 8,
        },
    ],
    };

    const handleCommentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // TODO: Handle send to backend new comment
        console.log(newComment);
        setNewComment('');
    };

    return (
        <>
            <TopNavbar />
            <Container className="my-4">
                <Row className="justify-content-center">
                    <Col md={8}>
                        
                        <PostContent postID={Number.parseInt(postID)}/>
                        { /* Reply to post form */}
                        <Form onSubmit={handleCommentSubmit}>
                            <Form.Group className="mb-3" controlId="newComment">
                            <Form.Label>Reply to this post</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={newComment}
                                onChange={e => setNewComment(e.target.value)}
                                placeholder="Write your comment here..."
                            />
                            </Form.Group>
                            <Button variant="primary" type="submit">
                            Post Comment
                            </Button>
                        </Form>

                        <hr></hr>
                        <h3>Comments:</h3>
                        <ListGroup>
                            {postData.comments.map(comment => (
                                <CommentItem
                                key={comment.id}
                                id={comment.id}
                                author={comment.author}
                                content={comment.content}
                                datePosted={comment.datePosted}
                                votes={comment.votes}
                                replies={comment.replies}
                                />
                            ))}
                        </ListGroup>
                    </Col>
                </Row>
            </Container>
        </>
    );
};

export default PostPage;
