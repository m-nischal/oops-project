// src/pages/retailer/reviews.js
import React, { useEffect, useState } from 'react';
import RetailerLayout from '../../components/RetailerLayout';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Star, Loader2, MessageSquare, AlertTriangle } from "lucide-react";

const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString('en-IN', {
        year: 'numeric', month: 'short', day: 'numeric'
    });
};

function StarRatingDisplay({ rating }) {
    const normalizedRating = Math.max(0, Math.min(5, rating));
    const fullStars = Math.floor(normalizedRating);
    const halfStar = normalizedRating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    const stars = [];

    for (let i = 0; i < fullStars; i++) {
        stars.push(<Star key={`full-${i}`} className="h-4 w-4 fill-yellow-400 text-yellow-400" />);
    }
    if (halfStar) {
        stars.push(<Star key="half" className="h-4 w-4 fill-yellow-400 text-yellow-400" />);
    }
    for (let i = 0; i < emptyStars; i++) {
        stars.push(<Star key={`empty-${i}`} className="h-4 w-4 fill-gray-300 text-gray-300" />);
    }
    
    return <div className="flex">{stars}</div>;
}


export default function RetailerReviewsPage() {
    const { isLoading: isAuthLoading } = useAuthGuard("RETAILER");
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [averageRating, setAverageRating] = useState(0);

    useEffect(() => {
        if (isAuthLoading) return;

        async function fetchReviews() {
            try {
                setLoading(true);
                const token = localStorage.getItem("token");
                // Fetch the retailer's profile which now includes Feedback
                const res = await fetch("/api/user/profile", {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.status === 401) throw new Error("Unauthorized. Please log in.");
                if (!res.ok) throw new Error("Failed to load retailer reviews");
                
                const data = await res.json();
                const feedback = data.user?.Feedback || [];
                setReviews(feedback);
                
                if (feedback.length > 0) {
                    const totalRating = feedback.reduce((sum, r) => sum + (r.rating || 0), 0);
                    setAverageRating((totalRating / feedback.length));
                } else {
                    setAverageRating(0);
                }

            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchReviews();
    }, [isAuthLoading]);

    if (isAuthLoading) return <RetailerLayout>Loading...</RetailerLayout>;

    return (
        <RetailerLayout>
            <div className="mb-6">
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <Star className="h-8 w-8 fill-yellow-400 text-yellow-400" /> Customer Reviews
                </h1>
                <p className="text-muted-foreground">
                    View feedback left by customers on your shop and service.
                </p>
            </div>
            
            {loading && <div className="flex justify-center py-10"><Loader2 className="animate-spin" /></div>}
            {error && <Alert variant="destructive"><AlertTriangle className="h-4 w-4"/><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}

            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="text-2xl">{averageRating.toFixed(1)} / 5</CardTitle>
                    <CardDescription>Average Rating from {reviews.length} total review(s)</CardDescription>
                </CardHeader>
            </Card>

            {!loading && !error && reviews.length === 0 && (
                <Card>
                    <CardContent className="pt-6 text-center text-muted-foreground">
                        <MessageSquare className="h-10 w-10 mx-auto mb-4 opacity-20" />
                        <p>No customer reviews yet.</p>
                    </CardContent>
                </Card>
            )}

            {!loading && !error && reviews.length > 0 && (
                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[100px]">Rating</TableHead>
                                    <TableHead>Comment</TableHead>
                                    <TableHead className="w-[150px]">Author</TableHead>
                                    <TableHead className="w-[120px]">Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {reviews.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).map((review, index) => (
                                    <TableRow key={index}>
                                        <TableCell>
                                            <StarRatingDisplay rating={review.rating} />
                                        </TableCell>
                                        <TableCell className="max-w-[400px] whitespace-normal">
                                            {review.comment || <em>(No comment provided)</em>}
                                        </TableCell>
                                        <TableCell className="font-medium">{review.author || "Anonymous"}</TableCell>
                                        <TableCell>{formatDate(review.createdAt)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </RetailerLayout>
    );
}