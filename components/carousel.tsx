import type { FC } from "react";
import { useMemo, useState } from "react";

type CarouselProps = {
	images: string[];
	title?: string;
};

export const Carousel: FC<CarouselProps> = ({ images, title = "Uploads" }) => {
	const safeImages = useMemo(
		() => (Array.isArray(images) ? images.filter((src) => typeof src === "string" && src.trim().length > 0) : []),
		[images],
	);
	const PAGE_SIZE = 5;
	const totalPages = Math.max(Math.ceil(safeImages.length / PAGE_SIZE), 0);
	const [currentPage, setCurrentPage] = useState(0);

	const hasImages = safeImages.length > 0;
	const boundedPage = hasImages ? Math.min(currentPage, Math.max(totalPages - 1, 0)) : 0;
	const startIndex = boundedPage * PAGE_SIZE;
	const endIndex = startIndex + PAGE_SIZE;
	const visibleImages = hasImages ? safeImages.slice(startIndex, endIndex) : [];
	const canPrev = hasImages && boundedPage > 0;
	const canNext = hasImages && boundedPage < Math.max(totalPages - 1, 0);

	const goPrev = () => {
		if (!hasImages) return;
		setCurrentPage((page) => Math.max(page - 1, 0));
	};

	const goNext = () => {
		if (!hasImages) return;
		setCurrentPage((page) => Math.min(page + 1, Math.max(totalPages - 1, 0)));
	};

	return (
		<div className="rounded-linktree bg-linktree-primary px-5 py-6 shadow-sm">
			<div className="mb-3 flex items-center justify-between">
				<div>
					<div className="text-sm font-semibold uppercase tracking-wide text-linktree-button-text/70">
						{title}
					</div>
					<div className="text-lg font-bold text-linktree-button-text">
						{hasImages ? `${safeImages.length} ${safeImages.length === 1 ? "image" : "images"}` : "No images yet"}
					</div>
				</div>
				{hasImages ? (
					<div className="flex items-center gap-2">
						<button
							type="button"
							onClick={goPrev}
							aria-label="Previous page"
							disabled={!canPrev}
							className={`rounded-linktree border border-linktree-button-bg/20 px-3 py-1 text-xs font-semibold text-linktree-button-text hover:bg-linktree-button-bg/10 cursor-pointer ${
								!canPrev ? "opacity-50 cursor-not-allowed hover:bg-transparent" : ""
							}`}
						>
							Prev
						</button>
						<button
							type="button"
							onClick={goNext}
							aria-label="Next page"
							disabled={!canNext}
							className={`rounded-linktree border border-linktree-button-bg/20 px-3 py-1 text-xs font-semibold text-linktree-button-text hover:bg-linktree-button-bg/10 cursor-pointer ${
								!canNext ? "opacity-50 cursor-not-allowed hover:bg-transparent" : ""
							}`}
						>
							Next
						</button>
					</div>
				) : null}
			</div>

			<div className="relative overflow-hidden rounded-linktree border border-linktree-button-bg/20 bg-linktree-button-bg/5">
				{hasImages ? (
					<div className="grid grid-cols-5 gap-1 p-0">
						{visibleImages.map((src, idx) => {
							const globalIndex = startIndex + idx;
							return (
								<div
									key={`thumb-${globalIndex}`}
									className="relative aspect-square overflow-hidden rounded-linktree bg-linktree-button-bg/10"
								>
									<img
										src={src}
										alt={`Upload ${globalIndex + 1} of ${safeImages.length}`}
										className="h-full w-full object-cover"
										loading="lazy"
									/>
								</div>
							);
						})}
						{Array.from({ length: Math.max(PAGE_SIZE - visibleImages.length, 0) }).map((_, idx) => (
							<div
								key={`empty-${idx}`}
								className="aspect-square rounded-linktree border border-dashed border-linktree-button-bg/10 bg-linktree-button-bg/5"
							/>
						))}
					</div>
				) : (
					<div className="flex aspect-[4/3] w-full items-center justify-center text-sm text-linktree-button-text/70">
						Drop or upload files to see them here
					</div>
				)}
			</div>

			{hasImages && totalPages > 1 ? (
				<div className="mt-3 flex items-center justify-center gap-2">
					{Array.from({ length: totalPages }).map((_, idx) => {
						const isActive = idx === boundedPage;
						return (
							<button
								type="button"
								key={`page-dot-${idx}`}
								aria-label={`Go to page ${idx + 1}`}
								onClick={() => setCurrentPage(idx)}
								className={`h-2.5 w-2.5 rounded-full ${
									isActive ? "bg-linktree-button-bg" : "bg-linktree-button-bg/30"
								}`}
							/>
						);
					})}
				</div>
			) : null}
			{hasImages ? (
				<div className="mt-2 flex justify-end">
					<div className="text-xs font-medium text-linktree-button-text/80">
						Page {boundedPage + 1} / {Math.max(totalPages, 1)}
					</div>
				</div>
			) : null}
		</div>
	);
};


