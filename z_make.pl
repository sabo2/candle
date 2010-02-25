
our $debug = 0;
our $version = 'v0.0.0';

&main();
exit(0);

sub main{
	&input_flags();
	&output();
}

sub input_flags{
	print "リリース用のファイルを出力しますか？[y] ";
	$_ = <STDIN>; tr/\r\n//d;
	if(/n/i){ $debug=1;}

	print "バージョンを入力してください[$version] ";
	$_ = <STDIN>; tr/\r\n//d;
	if($_){
		$version = $_;
		$version =~ s/\[a\]/α/g;
		$version =~ s/\[b\]/β/g;
	}
}

sub output{
	&output_file('Camp.js', ['source/Camp.js']);
	&output_file('CampFire.js', ['source/Camp.js', 'source/Fire.js']);
}
sub output_file{
	my $filename = $_[0];
	my @files = @{$_[1]};

	if(!$debug){
		open OUT, ">$filename.txt";
		&printfiles(\@files);
		close OUT;

		&output_doc("notices.txt", $filename);

		system("copy /Y /B .\\notices.txt + .\\$filename.txt .\\$filename");

		unlink("notices.txt");
		unlink("$filename.txt");
	}
	else{
		open OUT, ">$filename.txt";
		print OUT "// テスト用\n";
		&printfiles_debug(\@files);
		close OUT;

		system("copy /Y $filename.txt .\\$filename");
		unlink("$filename.txt");
	}
}

sub output_doc{
	my($file, $filename) = @_;
	my @dates = localtime(time);
	my $datestr = sprintf("%04d-%02d-%02d",1900+$dates[5],1+$dates[4],$dates[3]);

	open DOC, ">$file";

	print DOC <<"EOR";
/* 
 * $filename
 * 
 * $filename is a graphic library for JavaScript.
 * 
 * \@author  D.Kobayashi
 * \@version $version
 * \@date    $datestr
 * 
 * This script is referencing following library.
 *  uuCanvas.js (version 1.0)
 *  http://code.google.com/p/uupaa-js-spinoff/	uupaa.js SpinOff Project Home(Google Code)
 * 
 * This script is under the MIT license. Please see below.
 * http://www.opensource.org/licenses/mit-license.php
 * 
 */
EOR
	close DOC;
}

# ファイル出力関数
sub printfiles{
	my @files = @{$_[0]};
	foreach(@files){
		my $filename = $_;

		print STDERR $filename;

		# 実際の出力部
		open SRC, $filename;
		# 変換をかけたい場合は、、この中に変換処理を入れるべし
		while(<SRC>){
			my $sline = $_;
			$sline =~ tr/\r\n//d;
			$sline =~ s/\t//g;
			$sline =~ s/^\/\/.*//g;
			$sline =~ s/\/\*.*\*\///g;
			$sline =~ s/([^\\\:])\/\/.*/$1/g;
			$sline =~ s/[ ]*$//;
			$sline =~ s/^[ ]//;
			$sline =~ s/[ ]*(\:|\;|\.|\,|\=+|\|+|\&+|\+|\(|\)|\{|\}|\[|\]|\<|\>|\?)[ ]*/$1/g;
			$sline =~ s/[ ]{2,}\-[ ]*/\-/g;
			if($sline){ print OUT $sline;}
		}
		close SRC;
	}
}
sub printfiles_debug{
	my @files = @{$_[0]};
	foreach(@files){
		print OUT "document.writeln(\"<script type=\\\"text/javascript\\\" src=\\\"$_\\\"></script>\");\n";
	}
}
