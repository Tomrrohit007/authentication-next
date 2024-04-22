"use client";

import Link from "next/link";
import { Button } from "../ui/button";

type BackButtonProps = {
  href: string;
  label: string;
};

export const BackButton = ({ label, href }: BackButtonProps) => {
  return (
    <Button className="font-normal w-full" size="sm" variant="link" asChild>
      <Link href={href}>{label}</Link>
    </Button>
  );
};
